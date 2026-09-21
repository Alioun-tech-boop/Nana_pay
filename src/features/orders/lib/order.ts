import type { IconName } from '../../../design-system'
import type { FinancingMode, Order, OrderStatus } from '../../../types'
import { ORDER_LIFECYCLE } from '../../../lib/status'

export const FINANCING_MODE_LABELS: Record<FinancingMode, string> = {
  SAVINGS: 'Épargne progressive',
  VAULT: 'Coffre NanoPay',
  CREDIT: 'Crédit bancaire',
}

export const FINANCING_MODE_ICONS: Record<FinancingMode, IconName> = {
  SAVINGS: 'coins',
  VAULT: 'vault',
  CREDIT: 'bank',
}

export type OrderGroup = 'active' | 'progress' | 'completed'

export const ORDER_GROUP_LABELS: Record<OrderGroup, string> = {
  active: 'En financement',
  progress: 'En cours de retrait',
  completed: 'Terminées',
}

const PROGRESS_STATUSES: OrderStatus[] = [
  'FINANCED',
  'READY_TO_DELIVER',
  'QR_GENERATED',
  'QR_SCANNED',
  'WITHDRAWAL_CONFIRMED',
]

const COMPLETED_STATUSES: OrderStatus[] = ['DELIVERED', 'MERCHANT_PAID', 'COMPLETED']

export function getOrderGroup(status: OrderStatus): OrderGroup {
  if (COMPLETED_STATUSES.includes(status)) return 'completed'
  if (PROGRESS_STATUSES.includes(status)) return 'progress'
  return 'active'
}

export function getLifecycleIndex(status: OrderStatus): number {
  const index = ORDER_LIFECYCLE.indexOf(status)
  return index === -1 ? 0 : index
}

export function isQrAvailable(order: Order): boolean {
  return getLifecycleIndex(order.status) >= ORDER_LIFECYCLE.indexOf('FINANCED')
}