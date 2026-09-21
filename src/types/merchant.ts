import type { Money, ServerDate } from './common'
import type { FinancingMode } from './order'
import type { ProductStatus } from './product'
import type { QrState } from './qr'
import type { WithdrawalStatus } from './withdrawal'

export interface MerchantOrder {
  id: string
  reference: string
  productName: string
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface MerchantOrderDetail extends MerchantOrder {
  clientFullName: string
  financingMode: FinancingMode
  quantity: number
  qrState: QrState | null
  withdrawalStatus: WithdrawalStatus | null
  updatedAt: ServerDate
}

export interface MerchantTransaction {
  id: string
  orderReference: string
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface MerchantBalance {
  amount: number
  currency: string
}

export interface MerchantScanResult {
  qrId: string
  orderId: string
  orderReference: string
  clientFullName: string
  amount: Money
  state: QrState
  merchantAuthorized: boolean
}

export const MERCHANT_STORE_STATUSES = ['ACTIVE', 'PENDING_REVIEW', 'SUSPENDED'] as const

export type MerchantStoreStatus = (typeof MERCHANT_STORE_STATUSES)[number]

export interface MerchantStore {
  id: string
  name: string
  slug: string
  category: string
  description: string
  city: string
  commune: string
  phone: string
  email: string
  status: MerchantStoreStatus
  verified: boolean
  rating: number
  productsCount: number
  activeProductsCount: number
  ordersCount: number
  pendingSettlement: Money
  joinedAt: ServerDate
}

export interface MerchantProduct {
  id: string
  name: string
  description: string
  price: Money
  categoryId: string | null
  stockQuantity: number
  financingEligible: boolean
  status: ProductStatus
  updatedAt: ServerDate
}

export interface CreateMerchantProductInput {
  name: string
  description: string
  priceAmount: number
  currency: string
  stockQuantity: number
  categoryId: string | null
  financingEligible: boolean
}

export interface UpdateMerchantProductInput {
  name?: string
  description?: string
  priceAmount?: number
  stockQuantity?: number
  financingEligible?: boolean
  status?: ProductStatus
}

export interface MerchantSummary {
  balance: Money
  pendingSettlement: Money
  activeOrders: number
  ordersToDeliver: number
  awaitingWithdrawal: number
  salesThisMonth: Money
  productsOutOfStock: number
}

export interface MerchantPayment {
  id: string
  orderReference: string
  amount: Money
  status: string
  settledAt: ServerDate | null
  createdAt: ServerDate
}
