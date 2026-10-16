import { api } from '../api'
import type { Paginated, PaymentMethod, Savings, SavingsPayment } from '../types'

export interface StartSavingsInput {
  orderId: string
  idempotencyKey: string
}

/** Moyen utilisé pour un versement d'épargne. */
export type SavingsPaymentMethod = Extract<PaymentMethod, 'MOBILE_MONEY' | 'CARD'>

export interface SavingsPaymentInput {
  savingsId: string
  /** Montant libre du versement (≥ 1 000 F), validé par le backend. */
  amount: number
  method: SavingsPaymentMethod
  idempotencyKey: string
}

export interface SavingsQuery {
  page?: number
  pageSize?: number
}

export const savingsService = {
  getSavings(query: SavingsQuery = {}): Promise<Paginated<Savings>> {
    return api.request<Paginated<Savings>>({
      method: 'GET',
      path: '/savings',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getSavingsById(savingsId: string): Promise<Savings> {
    return api.request<Savings>({
      method: 'GET',
      path: `/savings/${savingsId}`,
    })
  },

  getSavingsHistory(savingsId: string): Promise<Paginated<SavingsPayment>> {
    return api.request<Paginated<SavingsPayment>>({
      method: 'GET',
      path: `/savings/${savingsId}/history`,
      query: { page: '1', pageSize: '50' },
    })
  },

  startSavings(input: StartSavingsInput): Promise<Savings> {
    return api.request<Savings>({
      method: 'POST',
      path: '/savings/start',
      body: { orderId: input.orderId },
      idempotencyKey: input.idempotencyKey,
    })
  },

  makeSavingsPayment(input: SavingsPaymentInput): Promise<{ accepted: boolean }> {
    return api.request<{ accepted: boolean }>({
      method: 'POST',
      path: `/savings/${input.savingsId}/payment`,
      body: { amount: input.amount, method: input.method },
      idempotencyKey: input.idempotencyKey,
    })
  },
}