import type { Money, ServerDate } from './common'
import type { CreditRequestStatus } from './financing'

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'CONFIRMED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_METHODS = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'VAULT'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const MOBILE_MONEY_PROVIDERS = ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'MTN_MONEY'] as const

export type MobileMoneyProvider = (typeof MOBILE_MONEY_PROVIDERS)[number]

export interface Payment {
  id: string
  reference: string
  orderId: string
  amount: Money
  method: PaymentMethod
  status: PaymentStatus
  provider: string | null
  confirmedAt: ServerDate | null
  createdAt: ServerDate
}

export interface CreditDecision {
  decision: Extract<CreditRequestStatus, 'APPROVED' | 'REFUSED'>
  reason: string
}