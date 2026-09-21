import { api } from '../api'
import type { Qr, QrStatus } from '../types'

export const qrService = {
  generateQr(orderId: string): Promise<Qr> {
    return api.request<Qr>({
      method: 'POST',
      path: `/orders/${orderId}/qr`,
    })
  },

  getQr(orderId: string): Promise<Qr> {
    return api.request<Qr>({
      method: 'GET',
      path: `/orders/${orderId}/qr`,
    })
  },

  getQrStatus(orderId: string): Promise<QrStatus> {
    return api.request<QrStatus>({
      method: 'GET',
      path: `/orders/${orderId}/qr/status`,
    })
  },
}