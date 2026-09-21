import { mockWithdrawals } from './db'
import {
  mockMerchantOrders,
  mockMerchantProducts,
  mockMerchantStore,
} from './proDb'
import {
  accepted,
  badRequest,
  bodyOf,
  businessRule,
  created,
  notFound,
  ok,
  paginate,
  parseQuery,
  preconditionFailed,
  secondsAgo,
} from './helpers'
import type { MockRoute } from './types'
import type { MerchantProduct, ProductStatus } from '../../types'

export const merchantRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/merchant/summary',
    handler: () => {
      const toDeliver = mockMerchantOrders.filter((order) => order.status === 'READY_TO_DELIVER').length
      const awaiting = mockMerchantOrders.filter(
        (order) => order.status === 'QR_GENERATED' || order.status === 'QR_SCANNED',
      ).length
      const sales = mockMerchantOrders.reduce((total, order) => total + order.amount.amount, 0)
      const outOfStock = mockMerchantProducts.filter((product) => product.status === 'OUT_OF_STOCK').length
      const completedStatuses = ['DELIVERED', 'MERCHANT_PAID', 'COMPLETED']
      return ok({
        balance: { amount: 212500, currency: 'XOF' },
        pendingSettlement: mockMerchantStore.pendingSettlement,
        activeOrders: mockMerchantOrders.filter((order) => !completedStatuses.includes(order.status)).length,
        ordersToDeliver: toDeliver,
        awaitingWithdrawal: awaiting,
        salesThisMonth: { amount: sales, currency: 'XOF' },
        productsOutOfStock: outOfStock,
      })
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/store',
    handler: () => ok({ ...mockMerchantStore }),
  },
  {
    method: 'PATCH',
    pattern: '/merchant/store',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const fields: Array<keyof typeof mockMerchantStore> = [
        'name',
        'description',
        'category',
        'city',
        'commune',
        'phone',
        'email',
      ]
      for (const field of fields) {
        const value = body[field]
        if (typeof value === 'string' && value.trim()) {
          ;(mockMerchantStore[field] as string) = value.trim()
        }
      }
      return ok({ ...mockMerchantStore })
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/products',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      let items = [...mockMerchantProducts]
      if (query.status) {
        items = items.filter((product) => product.status === query.status)
      }
      if (query.q) {
        const needle = query.q.toLowerCase()
        items = items.filter((product) => product.name.toLowerCase().includes(needle))
      }
      return ok(paginate(items, page, pageSize))
    },
  },
  {
    method: 'POST',
    pattern: '/merchant/products',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const priceAmount = typeof body.priceAmount === 'number' ? Math.round(body.priceAmount) : 0
      if (!name) return badRequest('PRODUCT_NAME_REQUIRED', 'Nom requis', 'Renseignez le nom du produit.', 'name')
      if (priceAmount <= 0) {
        return badRequest('PRODUCT_PRICE_INVALID', 'Prix invalide', 'Le prix doit être supérieur à zéro.', 'priceAmount')
      }
      const product: MerchantProduct = {
        id: `prd_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        name,
        description: typeof body.description === 'string' ? body.description.trim() : '',
        price: { amount: priceAmount, currency: typeof body.currency === 'string' ? body.currency : 'XOF' },
        categoryId: typeof body.categoryId === 'string' && body.categoryId ? body.categoryId : null,
        stockQuantity: typeof body.stockQuantity === 'number' ? Math.max(0, Math.round(body.stockQuantity)) : 0,
        financingEligible: Boolean(body.financingEligible),
        status: 'ACTIVE',
        updatedAt: secondsAgo(1),
      }
      mockMerchantProducts.unshift(product)
      mockMerchantStore.productsCount = mockMerchantProducts.length
      mockMerchantStore.activeProductsCount = mockMerchantProducts.filter(
        (item) => item.status === 'ACTIVE',
      ).length
      return created(product)
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/products/:id',
    handler: (ctx) => {
      const product = mockMerchantProducts.find((item) => item.id === ctx.params.id)
      if (!product) return notFound('PRODUCT_NOT_FOUND', 'Produit introuvable.')
      return ok(product)
    },
  },
  {
    method: 'PATCH',
    pattern: '/merchant/products/:id',
    handler: (ctx) => {
      const product = mockMerchantProducts.find((item) => item.id === ctx.params.id)
      if (!product) return notFound('PRODUCT_NOT_FOUND', 'Produit introuvable.')
      const body = bodyOf(ctx)
      if (typeof body.name === 'string' && body.name.trim()) product.name = body.name.trim()
      if (typeof body.description === 'string') product.description = body.description.trim()
      if (typeof body.priceAmount === 'number' && body.priceAmount > 0) {
        product.price = { amount: Math.round(body.priceAmount), currency: product.price.currency }
      }
      if (typeof body.stockQuantity === 'number') {
        product.stockQuantity = Math.max(0, Math.round(body.stockQuantity))
      }
      if (typeof body.financingEligible === 'boolean') product.financingEligible = body.financingEligible
      if (typeof body.status === 'string') {
        const allowed: ProductStatus[] = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']
        if (allowed.includes(body.status as ProductStatus)) product.status = body.status as ProductStatus
      }
      if (product.stockQuantity === 0 && product.status === 'ACTIVE') product.status = 'OUT_OF_STOCK'
      if (product.stockQuantity > 0 && product.status === 'OUT_OF_STOCK') product.status = 'ACTIVE'
      product.updatedAt = secondsAgo(1)
      mockMerchantStore.activeProductsCount = mockMerchantProducts.filter(
        (item) => item.status === 'ACTIVE',
      ).length
      return ok(product)
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/orders',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      let items = [...mockMerchantOrders]
      if (query.status) items = items.filter((order) => order.status === query.status)
      return ok(paginate(items, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/orders/:id',
    handler: (ctx) => {
      const order = mockMerchantOrders.find((item) => item.id === ctx.params.id)
      if (!order) return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      return ok(order)
    },
  },
  {
    method: 'POST',
    pattern: '/merchant/scan',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const payload = typeof body.payload === 'string' ? body.payload : ''
      const match = mockMerchantOrders.find((order) => payload.includes(order.reference))
      if (match) {
        return accepted({
          qrId: `qr_${match.id}`,
          orderId: match.id,
          orderReference: match.reference,
          clientFullName: match.clientFullName,
          amount: match.amount,
          state: match.qrState ?? 'SCANNED',
          merchantAuthorized: true,
        })
      }
      if (payload.includes('NEW')) {
        return accepted({
          qrId: 'qr_01HQRFULL',
          orderId: 'ord_01HQRGEN',
          orderReference: 'NP-2026-00001241',
          clientFullName: 'Ada Doumbia',
          amount: { amount: 125000, currency: 'XOF' },
          state: 'SCANNED',
          merchantAuthorized: true,
        })
      }
      return preconditionFailed('QR_INVALID', 'QR invalide', 'Ce QR est inconnu ou n’est plus valide.')
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/transactions',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const items = mockWithdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        orderReference: withdrawal.orderReference,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      }))
      return ok(paginate(items, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/payments',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const items = mockMerchantOrders
        .filter((order) => order.withdrawalStatus === 'CONFIRMED')
        .map((order) => ({
          id: `pay_${order.id}`,
          orderReference: order.reference,
          amount: order.amount,
          status: order.status === 'COMPLETED' || order.status === 'MERCHANT_PAID' ? 'SETTLED' : 'PENDING_SETTLEMENT',
          settledAt: order.status === 'COMPLETED' || order.status === 'MERCHANT_PAID' ? order.updatedAt : null,
          createdAt: order.createdAt,
        }))
      return ok(paginate(items, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/merchant/balance',
    handler: () => ok({ amount: 212500, currency: 'XOF' }),
  },
  {
    method: 'POST',
    pattern: '/merchant/settle',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const orderId = typeof body.orderId === 'string' ? body.orderId : ''
      const order = mockMerchantOrders.find((item) => item.id === orderId)
      if (!order) return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      if (order.withdrawalStatus !== 'CONFIRMED') {
        return businessRule(
          'SETTLEMENT_NOT_ALLOWED',
          'Règlement non autorisé',
          'Le retrait doit être confirmé avant tout règlement.',
        )
      }
      if (order.status === 'MERCHANT_PAID' || order.status === 'COMPLETED') {
        return businessRule('SETTLEMENT_ALREADY_DONE', 'Règlement déjà effectué', 'Cette commande a déjà été réglée.')
      }
      return accepted({ accepted: true })
    },
  },
  {
    method: 'GET',
    pattern: '/withdrawals',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      return ok(paginate(mockWithdrawals, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/withdrawals/:id',
    handler: (ctx) => {
      const item = mockWithdrawals.find((withdrawal) => withdrawal.id === ctx.params.id)
      if (!item) return ok(null)
      return ok(item)
    },
  },
  {
    method: 'POST',
    pattern: '/withdrawals',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const orderIdValue = typeof body.orderId === 'string' ? body.orderId : ''
      if (orderIdValue === 'ord_01HACTIVE') {
        return created({
          id: 'wdr_01HNEW',
          orderId: orderIdValue,
          orderReference: 'NP-2026-00001245',
          amount: { amount: 125000, currency: 'XOF' },
          method: typeof body.method === 'string' ? body.method : 'MOBILE_MONEY',
          status: 'PENDING',
          confirmedAt: null,
          createdAt: secondsAgo(5),
        })
      }
      return businessRule('WITHDRAWAL_NOT_ALLOWED', 'Retrait non autorisé', 'Cette commande ne permet pas de retrait pour le moment.')
    },
  },
]
