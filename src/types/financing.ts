import type { Money, ServerDate } from './common'
import type { PaymentMethod } from './payment'

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
  method: PaymentMethod
  status: SavingsPaymentStatus
  /** Référence fournisseur (Mobile Money / carte), si disponible. */
  providerRef: string | null
  paidAt: ServerDate
}

export interface Savings {
  id: string
  orderId: string
  orderReference: string
  targetAmount: Money
  savedAmount: Money
  /** Progression en %, calculée par le backend — jamais recalculée côté client. */
  progressPercent: number
  /** Mois restants avant échéance. `null` si aucune échéance n'est fixée. */
  remainingMonths: number | null
  /** Suggestion de versement mensuel (indicative, fournie par le backend). */
  monthlyTarget: Money | null
  /** Extension maximale autorisée, en mois (2). Valeur métier backend. */
  maxExtensionMonths: number
  /** Pénalité en % — renseignée uniquement si l'épargne a échoué (15). */
  penaltyPercent: number | null
  /** Part remboursée en % — renseignée uniquement si l'épargne a échoué (85). */
  refundPercent: number | null
  startedAt: ServerDate
  deadline: ServerDate | null
  cancelledAt: ServerDate | null
  cancellationReason: string | null
  status: SavingsStatus
  createdAt: ServerDate
  updatedAt: ServerDate
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
  /** Somme visée (« objectif ») définie par le client ; null tant qu'aucun plan n'est actif. */
  targetAmount: Money | null
  /** Montant prélevé chaque mois sur le salaire ; null tant qu'aucun plan n'est actif. */
  monthlyContribution: Money | null
  /** Progression vers la somme visée, calculée par le backend ; null si aucun plan. */
  progressPercent: number | null
  /** Reste à atteindre, calculé par le backend ; null si aucun plan. Jamais négatif. */
  remainingToTarget: Money | null
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
  /** Éligibilité globale décidée par la banque (source de vérité backend). */
  bankProfileValidated: boolean
  score: number | null
  maxAmount: Money | null
  status: string
  validatedAt: ServerDate | null
  createdAt: ServerDate
  updatedAt: ServerDate
}

export interface CreditRequest {
  id: string
  orderId: string
  orderReference: string
  requestedAmount: Money
  termMonths: number
  /** Taux annuel calculé par le backend. */
  ratePercent: number
  /** Montant total à rembourser, calculé par le backend. */
  totalRepayment: Money
  status: CreditRequestStatus
  decisionReason: string | null
  createdAt: ServerDate
  updatedAt: ServerDate
}

export interface CreateCreditRequest {
  orderId: string
  termMonths: number
}

export const CREDIT_STATUSES = ['ACTIVE', 'DISBURSED', 'REPAYING', 'COMPLETED', 'DEFAULTED'] as const

export type CreditStatus = (typeof CREDIT_STATUSES)[number]

export interface Credit {
  id: string
  reference: string
  requestId: string
  principal: Money
  /** Restant dû calculé par le backend depuis les remboursements réels. */
  remaining: Money
  ratePercent: number
  totalAmount: Money
  termMonths: number
  status: string
  disbursedAt: ServerDate | null
  createdAt: ServerDate
  updatedAt: ServerDate
}