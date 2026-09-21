import type { StatusTone } from '../design-system'

export interface StatusDefinition {
  label: string
  tone: StatusTone
}

export const STATUS_REGISTRY: Record<string, StatusDefinition> = {
  CART: { label: 'Panier', tone: 'neutral' },
  ORDER_CREATED: { label: 'Commande créée', tone: 'neutral' },
  FINANCING_IN_PROGRESS: { label: 'Financement en cours', tone: 'neutral' },
  FINANCED: { label: 'FINANCÉE', tone: 'success' },
  READY_TO_DELIVER: { label: 'PRÊTE À LIVRER', tone: 'success' },
  QR_GENERATED: { label: 'QR généré', tone: 'neutral' },
  QR_SCANNED: { label: 'QR scanné', tone: 'success' },
  WITHDRAWAL_CONFIRMED: { label: 'Retrait confirmé', tone: 'success' },
  DELIVERED: { label: 'LIVRÉE', tone: 'success' },
  MERCHANT_PAID: { label: 'Commerçant payé', tone: 'success' },
  COMPLETED: { label: 'TERMINÉE', tone: 'success' },

  IN_PROGRESS: { label: 'EN COURS', tone: 'neutral' },
  EXTENDED: { label: 'PROLONGATION', tone: 'neutral' },
  REACHED: { label: 'ATTEINTE', tone: 'success' },
  FAILED: { label: 'ÉCHOUÉE', tone: 'danger' },
  REFUNDED: { label: 'REMBOURSÉE', tone: 'danger' },
  CANCELLED: { label: 'Annulée', tone: 'danger' },

  IN_REVIEW: { label: 'EN ANALYSE', tone: 'neutral' },
  APPROVED: { label: 'ACCEPTÉE', tone: 'success' },
  REFUSED: { label: 'REFUSÉE', tone: 'danger' },

  VALID: { label: 'Valide', tone: 'success' },
  EXPIRED: { label: 'Expiré', tone: 'danger' },
  SCANNED: { label: 'Scanné', tone: 'success' },
  WITHDRAWN: { label: 'Retiré', tone: 'success' },
  SETTLED: { label: 'Règlement payé', tone: 'success' },
  PENDING_SETTLEMENT: { label: 'En attente de règlement', tone: 'neutral' },

  PENDING: { label: 'EN COURS', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmé', tone: 'success' },
  PROCESSING: { label: 'En traitement', tone: 'neutral' },
  ACTIVE: { label: 'Active', tone: 'success' },
  COMPLETED_SAVING: { label: 'Terminé', tone: 'success' },
  DEFAULTED: { label: 'En retard', tone: 'danger' },
  SUSPENDED: { label: 'Suspendu', tone: 'danger' },

  VERIFIED: { label: 'Vérifié', tone: 'success' },
  REJECTED: { label: 'Rejeté', tone: 'danger' },
}

export function isKnownStatus(status: string): boolean {
  return Object.prototype.hasOwnProperty.call(STATUS_REGISTRY, status)
}

export function getStatusDefinition(status: string): StatusDefinition {
  const known = STATUS_REGISTRY[status]
  if (known) return known
  return { label: status, tone: 'neutral' }
}

export function getStatusLabel(status: string): string {
  return getStatusDefinition(status).label
}

export const ORDER_LIFECYCLE: readonly string[] = [
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