import type { Money, ServerDate } from './common'
import type { Payment } from './payment'

export const ORDER_STATUSES = [
  'CART',
  'ORDER_CREATED',
  'FINANCING_IN_PROGRESS',
  'FINANCED',
  'READY_TO_DELIVER',
  'QR_GENERATED',
  'QR_SCANNED',
  'WITHDRAWAL_CONFIRMED',
  'DELIVERED',
  'MERCHANT_PAID',
  'COMPLETED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const FINANCING_MODES = ['SAVINGS', 'VAULT', 'CREDIT'] as const

export type FinancingMode = (typeof FINANCING_MODES)[number]

export interface OrderClientReference {
  id: string
  fullName: string
}

export interface OrderMerchantReference {
  id: string
  name: string
}

export interface OrderProductReference {
  id: string
  name: string
  price: Money
}

export interface OrderFinancingReference {
  id: string
  status: string
  amount: Money
}

export interface CreateOrderRequest {
  productId: string
  financingMode: FinancingMode
  quantity?: number
}

export interface Order {
  id: string
  reference: string
  client: OrderClientReference
  merchant: OrderMerchantReference
  product: OrderProductReference
  /** Quantité commandée, telle qu'enregistrée par le backend. */
  quantity: number
  /**
   * Total autoritaire de la commande (`prix × quantité`), fourni par le backend.
   *
   * Ne jamais le recalculer côté client (`AGENTS.md` §10) : c'est le montant
   * réellement financé.
   */
  totalPrice: Money
  financingMode: FinancingMode
  financing: OrderFinancingReference | null
  status: OrderStatus
  payment: Payment | null
  createdAt: ServerDate
  updatedAt: ServerDate
}

export interface OrderStatusResponse {
  status: OrderStatus
  at: ServerDate
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  status?: OrderStatus
}