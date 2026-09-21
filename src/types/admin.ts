import type { Money, ServerDate } from './common'
import type { PaymentStatus } from './payment'
import type { CreditRequestStatus, SavingsStatus } from './financing'
import type { QrState } from './qr'
import type { WithdrawalStatus } from './withdrawal'
import type { UserRole } from './auth'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  status: string
  createdAt: ServerDate
}

export interface AdminMerchant {
  id: string
  name: string
  email: string
  city: string
  status: string
  verified: boolean
  productsCount: number
  createdAt: ServerDate
}

export interface AdminOrderSummary {
  id: string
  reference: string
  clientFullName: string
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface AdminPaymentSummary {
  id: string
  reference: string
  clientFullName: string
  amount: Money
  status: PaymentStatus
  createdAt: ServerDate
}

export interface AdminCreditSummary {
  id: string
  clientFullName: string
  orderReference: string
  amount: Money
  status: CreditRequestStatus | string
  createdAt: ServerDate
}

export interface AuditEntry {
  id: string
  actorId: string
  action: string
  scope: string
  targetId: string
  at: ServerDate
  meta: Record<string, unknown> | null
}

export interface AdminKycRecord {
  id: string
  userId: string
  clientFullName: string
  documentType: string
  reference: string
  status: string
  submittedAt: ServerDate
  reviewedAt: ServerDate | null
}

export interface AdminSavingsSummary {
  id: string
  orderReference: string
  clientFullName: string
  targetAmount: Money
  savedAmount: Money
  progressPercent: number
  status: SavingsStatus
  deadline: ServerDate
}

export interface AdminVaultSummary {
  id: string
  clientFullName: string
  balance: Money
  monthlyContribution: Money | null
  eligible: boolean
  status: string
}

export interface AdminQrRecord {
  id: string
  orderId: string
  orderReference: string
  merchantName: string
  state: QrState
  generatedAt: ServerDate
  expiresAt: ServerDate
}

export interface AdminWithdrawalRecord {
  id: string
  orderReference: string
  merchantName: string
  amount: Money
  method: string
  status: WithdrawalStatus
  createdAt: ServerDate
}

export interface AdminSettlementRecord {
  id: string
  orderReference: string
  merchantName: string
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface AdminTransactionRecord {
  id: string
  reference: string
  type: string
  clientFullName: string
  merchantName: string | null
  amount: Money
  status: string
  createdAt: ServerDate
}

export interface AdminSummary {
  users: number
  clients: number
  merchants: number
  activeOrders: number
  pendingKyc: number
  paymentsPending: number
  creditsToReview: number
  volumeThisMonth: Money
}
