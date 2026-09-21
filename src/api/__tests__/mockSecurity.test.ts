import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '../client'
import { mockTransport } from '../mockTransport'

describe('mock security', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => 'mock-access-token')
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  describe('unauthenticated access', () => {
    it('returns 401 for protected endpoint without token', async () => {
      api.setTokenProvider(() => null)
      await expect(
        api.request({ method: 'GET', path: '/auth/me' }),
      ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 })
    })
  })

  describe('expired / invalid token', () => {
    it('returns 401 for invalid token', async () => {
      api.setTokenProvider(() => 'bogus-token')
      await expect(
        api.request({ method: 'GET', path: '/auth/me' }),
      ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 })
    })
  })

  describe('tampered IDs', () => {
    it('returns 404 for nonexistent product', async () => {
      await expect(
        api.request({ method: 'GET', path: '/products/prd_NONEXISTENT' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('returns 404 for nonexistent order', async () => {
      await expect(
        api.request({ method: 'GET', path: '/orders/ord_NONEXISTENT' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('returns 404 for nonexistent savings', async () => {
      await expect(
        api.request({ method: 'GET', path: '/savings/sav_NONEXISTENT' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('returns 404 for nonexistent merchant product', async () => {
      await expect(
        api.request({ method: 'GET', path: '/merchant/products/prd_NONEXISTENT' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('returns 404 for nonexistent credit request', async () => {
      await expect(
        api.request({ method: 'GET', path: '/credit/requests/cre_NONEXISTENT' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })
  })

  describe('invalid QR', () => {
    it('returns 412 for unrecognized QR scan payload', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/merchant/scan',
          body: { payload: 'TOTALLY_INVALID_QR_DATA' },
        }),
      ).rejects.toMatchObject({ kind: 'precondition', status: 412 })
    })
  })

  describe('duplicate submission (idempotency)', () => {
    it('order creation creates one order per call (no server-side idempotency in mock)', async () => {
      const order1 = await api.request<{ id: string }>({
        method: 'POST',
        path: '/orders',
        body: { productId: 'prd_01HPHONE1', quantity: 1 },
        idempotencyKey: 'idem-001',
      })
      const order2 = await api.request<{ id: string }>({
        method: 'POST',
        path: '/orders',
        body: { productId: 'prd_01HPHONE1', quantity: 1 },
        idempotencyKey: 'idem-001',
      })
      expect(order1.id).not.toBe(order2.id)
    })
  })

  describe('unrouteable endpoints', () => {
    it('returns 404 for completely unmocked route', async () => {
      await expect(
        api.request({ method: 'GET', path: '/nonexistent-endpoint' }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })
  })

  describe('merchant setlle without withdrawal confirmed', () => {
    it('rejects settlement when withdrawal not confirmed', async () => {
      const orders = await api.request<{ items: Array<{ id: string; status: string }> }>({
        method: 'GET',
        path: '/merchant/orders',
        query: { pageSize: '5' },
      })
      const orderWithoutWithdrawal = orders.items.find(
        (o) => o.status === 'READY_TO_DELIVER' || o.status === 'QR_GENERATED',
      )
      if (orderWithoutWithdrawal) {
        await expect(
          api.request({
            method: 'POST',
            path: '/merchant/settle',
            body: { orderId: orderWithoutWithdrawal.id },
          }),
        ).rejects.toMatchObject({ kind: 'business', status: 422 })
      }
    })
  })

  describe('merchant scan with valid order reference', () => {
    it('returns accepted for known order reference payload', async () => {
      const result = await api.request<{ merchantAuthorized: boolean }>({
        method: 'POST',
        path: '/merchant/scan',
        body: { payload: 'NP-2026-00001230' },
      })
      expect(result.merchantAuthorized).toBe(true)
    })
  })

  describe('credit request invalid term', () => {
    it('rejects credit request with term < 3 months', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/credit/request',
          body: { orderId: 'ord_01HACTIVE', termMonths: 1 },
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })

    it('rejects credit request with term > 24 months', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/credit/request',
          body: { orderId: 'ord_01HACTIVE', termMonths: 36 },
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })
  })

  describe('bank decision validation', () => {
    it('rejects invalid decision value', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/bank/credit-requests/cre_01HREQ1/decision',
          body: { decision: 'INVALID_DECISION' },
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })
  })

  describe('vault not eligible', () => {
    it('rejects vault use for non-vault order', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/vault/use',
          body: { orderId: 'ord_01HACTIVE' },
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })
  })

  describe('withdrawal not allowed', () => {
    it('rejects withdrawal for wrong order', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/withdrawals',
          body: { orderId: 'ord_01HDEL' },
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })
  })

  describe('auth flows', () => {
    it('register with missing fields returns 400', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/auth/register',
          body: { email: 'test@test.com' },
          auth: false,
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 400 })
    })

    it('verify with wrong code returns 400', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/auth/verify',
          body: { email: 'awa.kone@example.com', code: '999999' },
          auth: false,
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 400 })
    })

    it('login with wrong password returns 401', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/auth/login',
          body: { identifier: 'ada.doumbia@example.com', password: 'wrong' },
          auth: false,
        }),
      ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 })
    })

    it('login with correct credentials succeeds', async () => {
      const result = await api.request<{ accessToken: string; user: { role: string } }>({
        method: 'POST',
        path: '/auth/login',
        body: { identifier: 'ada.doumbia@example.com', password: 'correct' },
        auth: false,
      })
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.user.role).toBe('CLIENT')
    })

    it('refresh with invalid token returns 401', async () => {
      await expect(
        api.request({
          method: 'POST',
          path: '/auth/refresh',
          body: { refreshToken: 'invalid' },
          auth: false,
        }),
      ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 })
    })

    it('refresh with valid token succeeds', async () => {
      const result = await api.request<{ accessToken: string }>({
        method: 'POST',
        path: '/auth/refresh',
        body: { refreshToken: 'mock-refresh-token' },
        auth: false,
      })
      expect(result.accessToken).toBe('mock-access-token')
    })
  })
})