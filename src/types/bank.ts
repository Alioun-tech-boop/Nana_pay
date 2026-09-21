import type { Money, ServerDate } from './common'
import type { CreditRequest } from './financing'
import type { OrderStatus } from './order'

export interface BankCreditRequest extends CreditRequest {
  clientFullName: string
  riskLevel?: BankRiskLevel
}

export interface Settlement {
  id: string
  orderReference: string
  merchantId: string
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface BankOrder {
  id: string
  reference: string
  clientFullName: string
  amount: Money
  status: OrderStatus
  createdAt: ServerDate
}

export const BANK_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const

export type BankRiskLevel = (typeof BANK_RISK_LEVELS)[number]

export interface BankClientProfile {
  id: string
  fullName: string
  email: string
  phone: string
  city: string
  employer: string | null
  salaryVerified: boolean
  bankProfileValidated: boolean
  activeCreditAmount: Money | null
  requestsCount: number
  riskLevel: BankRiskLevel
  createdAt: ServerDate
}

export interface BankClientDocument {
  id: string
  label: string
  type: string
  status: string
  submittedAt: ServerDate
}

export interface BankClientProfileDetail extends BankClientProfile {
  yearsAtWork: number | null
  monthlySalary: Money | null
  totalRequested: Money
  documents: BankClientDocument[]
  requests: CreditRequest[]
}

export interface BankCreditRequestDetail extends BankCreditRequest {
  email: string
  phone: string
  city: string
  employer: string | null
  yearsAtWork: number | null
  monthlySalary: Money | null
  salaryVerified: boolean
  bankProfileValidated: boolean
  riskLevel: BankRiskLevel
  documents: BankClientDocument[]
  history: CreditRequest[]
}

export interface BankCredit {
  id: string
  reference: string
  clientFullName: string
  orderReference: string
  principal: Money
  remaining: Money
  ratePercent: number
  status: string
  nextDueAt: ServerDate | null
  createdAt: ServerDate
}

export interface BankTransfer {
  id: string
  reference: string
  clientFullName: string
  orderReference: string
  amount: Money
  method: string
  status: string
  createdAt: ServerDate
}

export interface BankSummary {
  requestsToReview: number
  approvedThisMonth: number
  refusedThisMonth: number
  disbursedThisMonth: Money
  portfolioOutstanding: Money
  defaultRate: number
}
