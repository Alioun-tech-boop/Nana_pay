import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '../client'
import { mockTransport } from '../mockTransport'
import {
  orderService,
  savingsService,
  qrService,
  paymentService,
  creditService,
  vaultService,
  marketplaceService,
  merchantService,
} from '../../services'

describe('business flows via mock backend', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => 'mock-access-token')
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  describe('client: product discovery', () => {
    it('fetches product list', async () => {
      const result = await marketplaceService.getProducts({ pageSize: 5 })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('fetches product by id', async () => {
      const product = await marketplaceService.getProduct('prd_01HPHONE1')
      expect(product.id).toBe('prd_01HPHONE1')
      expect(product.name).toBe('Smartphone Nova X5')
    })

    it('fetches merchant list', async () => {
      const result = await marketplaceService.getMerchants({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('fetches merchant by id', async () => {
      const merchant = await marketplaceService.getMerchant('mer_01HPLUS1')
      expect(merchant.id).toBe('mer_01HPLUS1')
      expect(merchant.name).toContain('ElectroPlus')
    })

    it('fetches merchant meta', async () => {
      const meta = await marketplaceService.getMerchantMeta()
      expect(meta.cities.length).toBeGreaterThan(0)
    })
  })

  describe('client: order creation', () => {
    it('creates an order with a valid product', async () => {
      const order = await orderService.createOrder({
        productId: 'prd_01HPHONE1',
        financingMode: 'SAVINGS',
        quantity: 1,
        idempotencyKey: 'test-order-001',
      })
      expect(order.id).toBeDefined()
      expect(order.financingMode).toBe('SAVINGS')
      expect(order.status).toBe('ORDER_CREATED')
    })

    it('rejects order for non-financeable product', async () => {
      await expect(
        orderService.createOrder({
          productId: 'prd_01HTV001',
          financingMode: 'SAVINGS',
          quantity: 1,
          idempotencyKey: 'test-order-002',
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })
  })

  describe('client: savings flow', () => {
    it('starts savings for an order', async () => {
      const savings = await savingsService.startSavings({
        orderId: 'ord_01HACTIVE',
        idempotencyKey: 'test-sav-001',
      })
      expect(savings.id).toBeDefined()
      expect(savings.status).toBe('IN_PROGRESS')
      expect(savings.targetAmount.amount).toBe(125000)
    })

    it('fetches savings by id', async () => {
      const savings = await savingsService.getSavingsById('sav_01HSAV1')
      expect(savings.id).toBe('sav_01HSAV1')
      expect(savings.progressPercent).toBe(34)
    })

    it('makes a savings payment and advances progress', async () => {
      const result = await savingsService.makeSavingsPayment({
        savingsId: 'sav_01HSAV1',
        idempotencyKey: 'test-pay-001',
      })
      expect(result.accepted).toBe(true)
      const updated = await savingsService.getSavingsById('sav_01HSAV1')
      expect(updated.savedAmount.amount).toBeGreaterThan(42500)
      expect(updated.progressPercent).toBeGreaterThan(34)
    })

    it('fetches savings payment history', async () => {
      const history = await savingsService.getSavingsHistory('sav_01HSAV1')
      expect(history.items.length).toBeGreaterThan(0)
    })

    it('REACHED savings shows 100% progress', async () => {
      const savings = await savingsService.getSavingsById('sav_01HSAV3')
      expect(savings.status).toBe('REACHED')
      expect(savings.progressPercent).toBe(100)
    })

    it('starts savings for eligible order', async () => {
      const savings = await savingsService.startSavings({
        orderId: 'ord_01HACTIVE',
        idempotencyKey: 'test-sav-002',
      })
      expect(savings.status).toBe('IN_PROGRESS')
    })
  })

  describe('client: QR generation', () => {
    it('generates QR for active order', async () => {
      const qr = await qrService.generateQr('ord_01HQRGEN')
      expect(qr.id).toBeDefined()
      expect(qr.state).toBe('VALID')
      expect(qr.payload).toContain('base64')
    })

    it('returns 404 for QR on nonexistent order', async () => {
      await expect(
        qrService.generateQr('ord_NONEXISTENT'),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })

    it('fetches QR status', async () => {
      const status = await qrService.getQrStatus('ord_01HQRGEN')
      expect(status.state).toBeDefined()
    })
  })

  describe('client: withdrawal request', () => {
    it('requests withdrawal for active order', async () => {
      const withdrawal = await paymentService.requestWithdrawal({
        orderId: 'ord_01HACTIVE',
        method: 'MOBILE_MONEY',
        idempotencyKey: 'test-wdr-001',
      })
      expect(withdrawal.id).toBeDefined()
      expect(withdrawal.status).toBe('PENDING')
    })

    it('rejects withdrawal for ineligible order', async () => {
      await expect(
        paymentService.requestWithdrawal({
          orderId: 'ord_01HDEL',
          method: 'MOBILE_MONEY',
          idempotencyKey: 'test-wdr-002',
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })

    it('lists existing withdrawals', async () => {
      const result = await paymentService.getWithdrawals({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })
  })

  describe('client: credit flow', () => {
    it('checks eligibility', async () => {
      const eligibility = await creditService.getEligibility()
      expect(eligibility.eligible).toBe(true)
    })

    it('creates credit request', async () => {
      const request = await creditService.requestCredit({
        orderId: 'ord_01HACTIVE',
        termMonths: 12,
        idempotencyKey: 'test-cred-001',
      })
      expect(request.id).toBeDefined()
      expect(request.status).toBe('IN_REVIEW')
    })

    it('rejects credit request with invalid term', async () => {
      await expect(
        creditService.requestCredit({
          orderId: 'ord_01HACTIVE',
          termMonths: 1,
          idempotencyKey: 'test-cred-002',
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })

    it('fetches credit request by id', async () => {
      const request = await creditService.getCreditRequest('cre_01HREQ1')
      expect(request.id).toBe('cre_01HREQ1')
      expect(request.status).toBe('IN_REVIEW')
    })

    it('fetches active credit', async () => {
      const credit = await creditService.getCredit()
      expect(credit).not.toBeNull()
      expect(credit?.status).toBe('ACTIVE')
    })

    it('lists credit requests', async () => {
      const result = await creditService.getCreditRequests({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })
  })

  describe('client: vault flow', () => {
    it('fetches vault status', async () => {
      const vault = await vaultService.getVault()
      expect(vault.eligible).toBe(true)
      expect(vault.balance.amount).toBeGreaterThan(0)
    })

    it('uses vault for eligible order', async () => {
      const result = await vaultService.useVault({
        orderId: 'ord_01HCOMPL',
        idempotencyKey: 'test-vault-001',
      })
      expect(result.used).toBe(true)
    })

    it('rejects vault use for non-vault order', async () => {
      await expect(
        vaultService.useVault({
          orderId: 'ord_01HACTIVE',
          idempotencyKey: 'test-vault-002',
        }),
      ).rejects.toMatchObject({ kind: 'business', status: 422 })
    })

    it('fetches vault transactions', async () => {
      const result = await vaultService.getTransactions({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })
  })

  describe('merchant: operations', () => {
    it('fetches merchant summary', async () => {
      const summary = await merchantService.getSummary()
      expect(summary.balance.amount).toBeGreaterThan(0)
      expect(typeof summary.activeOrders).toBe('number')
    })

    it('fetches merchant store', async () => {
      const store = await merchantService.getStore()
      expect(store.name).toBeDefined()
    })

    it('updates merchant store', async () => {
      const store = await merchantService.updateStore({ name: 'Updated Name' })
      expect(store.name).toBe('Updated Name')
    })

    it('lists merchant products', async () => {
      const result = await merchantService.getStoreProducts({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('creates a merchant product', async () => {
      const product = await merchantService.createProduct({
        name: 'Test Product',
        description: 'Produit de test',
        priceAmount: 50000,
        currency: 'XOF',
        stockQuantity: 10,
        categoryId: 'cat_telephonie',
        financingEligible: true,
      })
      expect(product.id).toBeDefined()
      expect(product.name).toBe('Test Product')
      expect(product.status).toBe('ACTIVE')
    })

    it('fetches merchant product by id', async () => {
      const products = await merchantService.getStoreProducts({ pageSize: 1 })
      const product = await merchantService.getProduct(products.items[0].id)
      expect(product.id).toBe(products.items[0].id)
    })

    it('lists merchant orders', async () => {
      const result = await merchantService.getOrders({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('merchant scans valid QR payload', async () => {
      const result = await merchantService.scanQr({
        payload: 'NP-2026-00001230',
        idempotencyKey: 'test-scan-001',
      })
      expect(result.merchantAuthorized).toBe(true)
      expect(result.orderId).toBeDefined()
    })

    it('merchant scans invalid QR payload', async () => {
      await expect(
        merchantService.scanQr({
          payload: 'INVALID_PAYLOAD',
          idempotencyKey: 'test-scan-002',
        }),
      ).rejects.toMatchObject({ kind: 'precondition', status: 412 })
    })

    it('lists merchant transactions/withdrawals', async () => {
      const result = await merchantService.getTransactions({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists merchant payments', async () => {
      const result = await merchantService.getPayments({ pageSize: 10 })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('gets merchant balance', async () => {
      const balance = await merchantService.getBalance()
      expect(balance.amount).toBeGreaterThan(0)
    })

    it('settles order with confirmed withdrawal', async () => {
      const result = await merchantService.settle({
        orderId: 'ord_01HMWCONF',
        idempotencyKey: 'test-settle-001',
      })
      expect(result.accepted).toBe(true)
    })
  })

  describe('bank: credit management', () => {
    it('fetches bank summary', async () => {
      const result = await api.request<{ requestsToReview: number }>({
        method: 'GET',
        path: '/bank/summary',
      })
      expect(typeof result.requestsToReview).toBe('number')
    })

    it('lists bank credit requests', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/bank/credit-requests',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('gets bank credit request detail', async () => {
      const detail = await api.request<{ id: string; status: string }>({
        method: 'GET',
        path: '/bank/credit-requests/cre_01HREQ1',
      })
      expect(detail.id).toBe('cre_01HREQ1')
      expect(detail.status).toBe('IN_REVIEW')
    })

    it('approves credit request', async () => {
      const result = await api.request<{ status: string }>({
        method: 'POST',
        path: '/bank/credit-requests/cre_01HREQ1/decision',
        body: { decision: 'APPROVED', reason: 'Profil solide' },
      })
      expect(result.status).toBe('APPROVED')
    })

    it('lists bank credits', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/bank/credits',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists bank transfers', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/bank/transfers',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists bank profiles', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/bank/profiles',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('gets bank profile detail', async () => {
      const profiles = await api.request<{ items: Array<{ id: string }> }>({
        method: 'GET',
        path: '/bank/profiles',
        query: { pageSize: '1' },
      })
      const detail = await api.request<{ id: string }>({
        method: 'GET',
        path: `/bank/profiles/${profiles.items[0].id}`,
      })
      expect(detail.id).toBe(profiles.items[0].id)
    })
  })

  describe('admin: supervision', () => {
    it('fetches admin summary', async () => {
      const result = await api.request<{ users: number; merchants: number }>({
        method: 'GET',
        path: '/admin/summary',
      })
      expect(result.users).toBeGreaterThan(0)
      expect(result.merchants).toBeGreaterThan(0)
    })

    it('lists admin users', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/users',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin merchants', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/merchants',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin orders', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/orders',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin payments', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/payments',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin savings', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/savings',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin credits', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/credits',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin withdrawals', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/withdrawals',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThan(0)
    })

    it('lists admin KYC', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/kyc',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('lists admin audit log', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/audit',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('lists admin settlements', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/settlements',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('lists admin transactions', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/transactions',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('lists admin QR', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/qr',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })

    it('lists admin vaults', async () => {
      const result = await api.request<{ items: unknown[] }>({
        method: 'GET',
        path: '/admin/vaults',
        query: { pageSize: '10' },
      })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })
  })
})