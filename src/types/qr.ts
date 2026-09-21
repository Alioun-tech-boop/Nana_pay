import type { ServerDate } from './common'

export const QR_STATES = ['VALID', 'EXPIRED', 'SCANNED', 'WITHDRAWN', 'SETTLED'] as const

export type QrState = (typeof QR_STATES)[number]

export interface Qr {
  id: string
  orderId: string
  payload: string
  expiresAt: ServerDate
  state: QrState
}

export interface QrStatus {
  state: QrState
  until: ServerDate | null
}