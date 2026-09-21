import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '../client'
import { AbortedError, AppError } from '../../lib/errors'
import type { Transport } from '../transport'

function fakeTransport(status: number, body: unknown = {}): Transport {
  return {
    async send() {
      return { status, data: body }
    },
  }
}

function errorTransport(status: number, body: unknown = { code: 'ERR', title: 'E', detail: '' }): Transport {
  return fakeTransport(status, body)
}

function throwTransport(error: unknown): Transport {
  return {
    async send() {
      throw error
    },
  }
}

describe('api.client', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(null as unknown as Transport)
    api.setTokenProvider(() => 'test-token')
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  describe('error mapping', () => {
    it('maps 404 → not-found', async () => {
      api.setTransportForTests(errorTransport(404))
      await expect(api.request({ method: 'GET', path: '/x' })).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('maps 409 → conflict', async () => {
      api.setTransportForTests(errorTransport(409))
      await expect(api.request({ method: 'POST', path: '/x' })).rejects.toMatchObject({ kind: 'conflict', status: 409 })
    })

    it('maps 422 → business', async () => {
      api.setTransportForTests(errorTransport(422))
      await expect(api.request({ method: 'POST', path: '/x' })).rejects.toMatchObject({ kind: 'business', status: 422 })
    })

    it('maps 429 → rate-limit', async () => {
      api.setTransportForTests(errorTransport(429))
      await expect(api.request({ method: 'GET', path: '/x' })).rejects.toMatchObject({ kind: 'rate-limit', status: 429 })
    })

    it('maps 500 → server', async () => {
      api.setTransportForTests(errorTransport(500))
      await expect(api.request({ method: 'GET', path: '/x' })).rejects.toMatchObject({ kind: 'server', status: 500 })
    })

    it('network failure (TypeError) → network', async () => {
      api.setTransportForTests(throwTransport(new TypeError('fetch failed')))
      const error = (await api.request({ method: 'GET', path: '/x' }).catch((e) => e)) as AppError
      expect(error).toBeInstanceOf(AppError)
      expect(error.kind).toBe('network')
    })
  })

  describe('abort', () => {
    it('rethrows AbortError without wrapping', async () => {
      api.setTransportForTests(throwTransport(new AbortedError()))
      await expect(
        api.request({ method: 'GET', path: '/x', signal: AbortSignal.abort() }),
      ).rejects.toBeInstanceOf(AbortedError)
    })
  })

  describe('auth retry', () => {
    it('retries once on 401 with refresh and succeeds', async () => {
      let callCount = 0
      const transport: Transport = {
        async send() {
          callCount += 1
          if (callCount === 1) return { status: 401, data: {} }
          return { status: 200, data: { ok: true } }
        },
      }
      api.setTransportForTests(transport)
      api.setRefreshProvider(async () => 'refreshed')
      const result = await api.request({ method: 'GET', path: '/x' })
      expect(result).toEqual({ ok: true })
      expect(callCount).toBe(2)
    })

    it('calls auth failure handler when refresh fails', async () => {
      const handler = vi.fn()
      api.setTransportForTests(errorTransport(401))
      api.setRefreshProvider(async () => 'failed')
      api.setAuthenticationFailureHandler(handler)
      await api.request({ method: 'GET', path: '/x' }).catch(() => {})
      expect(handler).toHaveBeenCalledOnce()
    })

    it('does not retry when auth=false', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 401, data: {} }
        },
      })
      await api.request({ method: 'GET', path: '/x', auth: false }).catch(() => {})
      expect(callCount).toBe(1)
    })
  })

  describe('idempotency', () => {
    it('sends Idempotency-Key header', async () => {
      let receivedHeaders: Record<string, string> = {}
      api.setTransportForTests({
        async send(req) {
          receivedHeaders = req.headers
          return { status: 200, data: null }
        },
      })
      await api.request({
        method: 'POST',
        path: '/x',
        body: {},
        idempotencyKey: 'idem-123',
      })
      expect(receivedHeaders['Idempotency-Key']).toBe('idem-123')
    })
  })

  describe('cache', () => {
    it('caches GET within TTL', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 200, data: { v: callCount } }
        },
      })
      const a = await api.request({ method: 'GET', path: '/cached', cache: { ttlMs: 5000 } })
      const b = await api.request({ method: 'GET', path: '/cached', cache: { ttlMs: 5000 } })
      expect(callCount).toBe(1)
      expect(a).toEqual({ v: 1 })
      expect(b).toEqual({ v: 1 })
    })

    it('invalidates by path prefix', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 200, data: { v: callCount } }
        },
      })
      await api.request({ method: 'GET', path: '/notifications/summary', cache: { ttlMs: 5000 } })
      api.invalidateCache('/notifications')
      await api.request({ method: 'GET', path: '/notifications/summary', cache: { ttlMs: 5000 } })
      expect(callCount).toBe(2)
    })

    it('does not cache POST', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 200, data: { v: callCount } }
        },
      })
      await api.request({ method: 'POST', path: '/x', body: {}, cache: { ttlMs: 5000 } })
      await api.request({ method: 'POST', path: '/x', body: {}, cache: { ttlMs: 5000 } })
      expect(callCount).toBe(2)
    })

    it('clearCache removes all entries', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 200, data: { v: callCount } }
        },
      })
      await api.request({ method: 'GET', path: '/a', cache: { ttlMs: 5000 } })
      await api.request({ method: 'GET', path: '/b', cache: { ttlMs: 5000 } })
      api.clearCache()
      await api.request({ method: 'GET', path: '/a', cache: { ttlMs: 5000 } })
      await api.request({ method: 'GET', path: '/b', cache: { ttlMs: 5000 } })
      expect(callCount).toBe(4)
    })

    it('does not cache when no cache option', async () => {
      let callCount = 0
      api.setTransportForTests({
        async send() {
          callCount += 1
          return { status: 200, data: { v: callCount } }
        },
      })
      await api.request({ method: 'GET', path: '/x' })
      await api.request({ method: 'GET', path: '/x' })
      expect(callCount).toBe(2)
    })
  })

  describe('token', () => {
    it('sends Authorization header when token exists', async () => {
      let receivedHeaders: Record<string, string> = {}
      api.setTransportForTests({
        async send(req) {
          receivedHeaders = req.headers
          return { status: 200, data: null }
        },
      })
      api.setTokenProvider(() => 'my-jwt')
      await api.request({ method: 'GET', path: '/x' })
      expect(receivedHeaders['Authorization']).toBe('Bearer my-jwt')
    })

    it('omits Authorization when auth=false', async () => {
      let receivedHeaders: Record<string, string> = {}
      api.setTransportForTests({
        async send(req) {
          receivedHeaders = req.headers
          return { status: 200, data: null }
        },
      })
      await api.request({ method: 'GET', path: '/x', auth: false })
      expect(receivedHeaders['Authorization']).toBeUndefined()
    })
  })
})