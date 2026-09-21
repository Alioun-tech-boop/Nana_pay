import type { Money, ServerDate } from './common'

export const SAVINGS_STATUSES = [
  'IN_PROGRESS',
  'EXTENDED',
  'REACHED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
] as const

export type SavingsStatus = (typeof SAVINGS_STATUSES)[number]

export const SAVINGS_PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'REFUNDED'] as const

export type SavingsPaymentStatus = (typeof SAVINGS_PAYMENT_STATUSES)[number]

export interface SavingsPayment {
  id: string
  amount: Money
  date: ServerDate
  status: SavingsPaymentStatus
}

export interface Savings {
  id: string
  orderId: string
  orderReference: string
  targetAmount: Money
  savedAmount: Money
  progressPercent: number
  remainingMonths: number
  maxExtensionMonths: number
  startedAt: ServerDate
  deadline: ServerDate
  status: SavingsStatus
  nextPaymentDue: Money
}

export interface StartSavingsRequest {
  orderId: string
}

export const VAULT_TRANSACTION_DIRECTIONS = ['CREDIT', 'DEBIT'] as const

export type VaultTransactionDirection = (typeof VAULT_TRANSACTION_DIRECTIONS)[number]

export interface VaultTransaction {
  id: string
  direction: VaultTransactionDirection
  amount: Money
  orderReference: string | null
  createdAt: ServerDate
}

export interface Vault {
  id: string
  balance: Money
  eligible: boolean
  monthlyContribution: Money | null
  transactionsCount: number
}

export interface UseVaultRequest {
  orderId: string
}

export const CREDIT_REQUEST_STATUSES = [
  'IN_REVIEW',
  'APPROVED',
  'REFUSED',
  'CANCELLED',
] as const

export type CreditRequestStatus = (typeof CREDIT_REQUEST_STATUSES)[number]

export interface Eligibility {
  eligible: boolean
  reasons: string[]
}

export interface CreditProfile {
  id: string
  employer: string | null
  salaryVerified: boolean
  bankProfileValidated: boolean
  yearsAtWork: number | null
  monthlySalary: Money | null
}

export interface CreditRequest {
  id: string
  orderReference: string
  clientId: string
  requestedAmount: Money
  termMonths: number
  status: CreditRequestStatus
  decisionReason: string | null
  createdAt: ServerDate
}

export interface CreateCreditRequest {
  orderId: string
  termMonths: number
}

export const CREDIT_STATUSES = ['ACTIVE', 'COMPLETED', 'DEFAULTED'] as const

export type CreditStatus = (typeof CREDIT_STATUSES)[number]

export interface Credit {
  id: string
  reference: string
  principal: Money
  remaining: Money
  ratePercent: number
  status: CreditStatus
  nextDueAt: ServerDate | null
  createdAt: ServerDate
}