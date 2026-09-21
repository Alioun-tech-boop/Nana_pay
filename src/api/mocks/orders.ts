import { mockMerchants, mockOrders, mockProducts } from './db'
import { bodyOf, businessRule, created, notFound, ok, paginate, parseQuery, secondsAgo } from './helpers'
import type { MockRoute } from './types'
import type { Order, FinancingMode } from '../../types'

let generatedCounter = 0

function nextReference(): string {
  generatedCounter += 1
  const base = 1346 + generatedCounter
  return `NP-2026-0000${String(base).padStart(4, '0')}`
}

function merchantName(merchantId: string): string {
  return mockMerchants.find((m) => m.id === merchantId)?.name ?? merchantId
}

function buildOrderFromProduct(productId: string, quantity = 1): Order | null {
  const product = mockProducts.find((item) => item.id === productId)
  if (!product) return null
  if (!product.financingEligible || product.status !== 'ACTIVE' || !product.stock.available) return null
  const safeQuantity = Math.max(1, Math.min(product.stock.quantity, Math.floor(quantity) || 1))
  const order: Order = {
    id: `ord_01HGEN${generatedCounter}`,
    reference: nextReference(),
    client: { id: 'usr_01HCLIENT', fullName: 'Ada Doumbia' },
    merchant: { id: product.merchantId, name: merchantName(product.merchantId) },
    product: {
      id: product.id,
      name: product.name,
      price: { amount: product.price.amount * safeQuantity, currency: product.price.currency },
    },
    financingMode: 'SAVINGS' as FinancingMode,
    financing: null,
    status: 'ORDER_CREATED',
    payment: null,
    createdAt: secondsAgo(120),
    updatedAt: secondsAgo(120),
  }
  mockOrders.push(order)
  return order
}

export const orderRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: '/orders',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const productId = typeof body.productId === 'string' ? body.productId : ''
      const quantity = typeof body.quantity === 'number' ? body.quantity : 1
      const rawMode = typeof body.financingMode === 'string' ? body.financingMode : 'SAVINGS'
      const mode: FinancingMode = rawMode === 'VAULT' || rawMode === 'CREDIT' ? rawMode : 'SAVINGS'
      const order = buildOrderFromProduct(productId, quantity)
      if (!order) {
        return businessRule(
          'PRODUCT_NOT_FINANCABLE',
          'Produit non finançable',
          'Ce produit ne peut pas être financé pour le moment.',
        )
      }
      order.financingMode = mode
      return created(order)
    },
  },
  {
    method: 'GET',
    pattern: '/orders',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const status = query.status
      const filtered = status ? mockOrders.filter((order) => order.status === status) : mockOrders
      const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return ok(paginate(sorted, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/orders/:id',
    handler: (ctx) => {
      const order = mockOrders.find((item) => item.id === ctx.params.id)
      if (!order) return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      return ok(order)
    },
  },
  {
    method: 'GET',
    pattern: '/orders/:id/status',
    handler: (ctx) => {
      const order = mockOrders.find((item) => item.id === ctx.params.id)
      if (!order) return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      return ok({ status: order.status, at: order.updatedAt })
    },
  },
]