import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '../client'
import { AbortedError, AppError, parseRetryAfter, toUserMessage } from '../../lib/errors'
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

/** Transport qui renvoie aussi des en-têtes de réponse (ex. `Retry-After`). */
function headerTransport(status: number, headers: Record<string, string>): Transport {
  return {
    async send() {
      return { status, data: { code: 'RATE_LIMITED', title: 'Trop de requêtes', detail: '' }, headers }
    },
  }
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

  describe('rate limit', () => {
    it('exposes Retry-After, so the user is told when to retry', async () => {
      api.setTransportForTests(headerTransport(429, { 'retry-after': '30' }))
      const error = (await api.request({ method: 'GET', path: '/x' }).catch((e) => e)) as AppError
      expect(error.kind).toBe('rate-limit')
      expect(error.retryAfterSeconds).toBe(30)
      expect(toUserMessage(error)).toContain('30 secondes')
    })

    it('accepts an HTTP-date Retry-After and never displays a negative delay', async () => {
      const future = new Date(Date.now() + 10_000).toUTCString()
      expect(parseRetryAfter(future)).toBeGreaterThan(0)
      const past = new Date(Date.now() - 60_000).toUTCString()
      expect(parseRetryAfter(past)).toBe(0)
      expect(parseRetryAfter(null)).toBeNull()
      expect(parseRetryAfter('pas-une-date')).toBeNull()
    })

    it('falls back to a generic message when the delay is unhelpful', async () => {
      api.setTransportForTests(headerTransport(429, {}))
      const error = (await api.request({ method: 'GET', path: '/x' }).catch((e) => e)) as AppError
      expect(error.retryAfterSeconds).toBeNull()
      expect(toUserMessage(error)).toMatch(/Trop de tentatives/)
    })
  })

  describe('user-facing messages', () => {
    it('never shows a raw technical route error to the user', async () => {
      api.setTransportForTests(
        fakeTransport(404, {
          statusCode: 404,
          code: 'NOT_FOUND',
          title: 'Ressource introuvable',
          detail: 'Cannot POST /api/auth/verify',
          field: null,
        }),
      )
      const error = (await api.request({ method: 'POST', path: '/x' }).catch((e) => e)) as AppError
      expect(toUserMessage(error)).not.toMatch(/Cannot POST/)
      // Le `title` du backend est déjà rédigé pour l'utilisateur : on le garde.
      expect(toUserMessage(error)).toBe('Ressource introuvable')
    })

    it('keeps a business detail written for the user', async () => {
      api.setTransportForTests(
        fakeTransport(422, {
          code: 'INSUFFICIENT_SAVINGS',
          title: 'Épargne insuffisante',
          detail: 'Il manque 25 000 XOF pour débloquer le retrait.',
          field: null,
        }),
      )
      const error = (await api.request({ method: 'POST', path: '/x' }).catch((e) => e)) as AppError
      expect(toUserMessage(error)).toBe('Il manque 25 000 XOF pour débloquer le retrait.')
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

    it('keeps Authorization on auth=false requests (public routes while signed in)', async () => {
      let receivedHeaders: Record<string, string> = {}
      api.setTransportForTests({
        async send(req) {
          receivedHeaders = req.headers
          return { status: 200, data: null }
        },
      })
      await api.request({ method: 'GET', path: '/x', auth: false })
      expect(receivedHeaders['Authorization']).toBe('Bearer test-token')
    })

    it('omits Authorization when no token is available', async () => {
      let receivedHeaders: Record<string, string> = {}
      api.setTransportForTests({
        async send(req) {
          receivedHeaders = req.headers
          return { status: 200, data: null }
        },
      })
      api.setTokenProvider(() => null)
      await api.request({ method: 'GET', path: '/x' })
      expect(receivedHeaders['Authorization']).toBeUndefined()
    })

    it('auth=false does not refresh or sign the user out on 401', async () => {
      let refreshCalls = 0
      let failureCalls = 0
      api.setRefreshProvider(async () => {
        refreshCalls += 1
        return 'refreshed'
      })
      api.setAuthenticationFailureHandler(() => {
        failureCalls += 1
      })
      api.setTransportForTests(errorTransport(401, { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' }))
      const error = (await api.request({ method: 'GET', path: '/x', auth: false }).catch((e) => e)) as AppError
      expect(error.kind).toBe('unauthorized')
      expect(refreshCalls).toBe(0)
      expect(failureCalls).toBe(0)
    })
  })
})