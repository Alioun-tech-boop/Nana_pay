import { api } from '../api'
import type {
  Paginated,
  Payment,
  MobileMoneyProvider,
  Withdrawal,
  WithdrawalMethod,
  WithdrawalQuery,
} from '../types'

export interface StartMobileMoneyPaymentInput {
  provider: MobileMoneyProvider
  phoneNumber: string
  orderId?: string
  savingsId?: string
  idempotencyKey: string
}

export interface StartCardPaymentInput {
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  cardholderName: string
  orderId?: string
  savingsId?: string
  idempotencyKey: string
}

export interface RequestWithdrawalInput extends WithdrawalQuery {
  orderId: string
  method: WithdrawalMethod
  idempotencyKey: string
}

export const paymentService = {
  startCardPayment(input: StartCardPaymentInput): Promise<Payment> {
    return api.request<Payment>({
      method: 'POST',
      path: '/payments/card',
      body: {
        cardNumber: input.cardNumber,
        expiryMonth: input.expiryMonth,
        expiryYear: input.expiryYear,
        cvv: input.cvv,
        cardholderName: input.cardholderName,
        orderId: input.orderId,
        savingsId: input.savingsId,
      },
      idempotencyKey: input.idempotencyKey,
    })
  },

  startMobileMoneyPayment(input: StartMobileMoneyPaymentInput): Promise<Payment> {
    return api.request<Payment>({
      method: 'POST',
      path: '/payments/mobile-money',
      body: {
        provider: input.provider,
        phoneNumber: input.phoneNumber,
        orderId: input.orderId,
        savingsId: input.savingsId,
      },
      idempotencyKey: input.idempotencyKey,
    })
  },

  getWithdrawals(query: WithdrawalQuery = {}): Promise<Paginated<Withdrawal>> {
    return api.request<Paginated<Withdrawal>>({
      method: 'GET',
      path: '/withdrawals',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getWithdrawal(withdrawalId: string): Promise<Withdrawal> {
    return api.request<Withdrawal>({
      method: 'GET',
      path: `/withdrawals/${withdrawalId}`,
    })
  },

  requestWithdrawal(input: RequestWithdrawalInput): Promise<Withdrawal> {
    return api.request<Withdrawal>({
      method: 'POST',
      path: '/withdrawals',
      body: { orderId: input.orderId, method: input.method },
      idempotencyKey: input.idempotencyKey,
    })
  },
}