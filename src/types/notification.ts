import type { ServerDate } from './common'

export const NOTIFICATION_TYPES = [
  'PAYMENT_CONFIRMED',
  'SAVINGS_UPDATED',
  'SAVINGS_EXTENDED',
  'CREDIT_APPROVED',
  'CREDIT_REFUSED',
  'QR_GENERATED',
  'WITHDRAWAL_CONFIRMED',
  'DELIVERY_CONFIRMED',
  'MERCHANT_PAID',
  'ORDER_COMPLETED',
  'SYSTEM',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  createdAt: ServerDate
  data: Record<string, unknown> | null
}

export interface NotificationSummary {
  unread: number
}