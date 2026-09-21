import type { Money, ServerDate } from './common'

export const WITHDRAWAL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED'] as const

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number]

export const WITHDRAWAL_METHODS = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'] as const

export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number]

export interface Withdrawal {
  id: string
  orderId: string
  orderReference: string
  amount: Money
  method: WithdrawalMethod
  status: WithdrawalStatus
  confirmedAt: ServerDate | null
  createdAt: ServerDate
}

export interface WithdrawalRequest {
  orderId: string
  method: WithdrawalMethod
}

export interface WithdrawalQuery {
  page?: number
  pageSize?: number
}