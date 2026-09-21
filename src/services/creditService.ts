import { api } from '../api'
import type {
  Credit,
  CreditRequest,
  CreditRequestStatus,
  Eligibility,
  Paginated,
} from '../types'

export interface RequestCreditInput {
  orderId: string
  termMonths: number
  idempotencyKey: string
}

export interface CreditRequestsQuery {
  status?: CreditRequestStatus
  page?: number
  pageSize?: number
}

export const creditService = {
  getEligibility(): Promise<Eligibility> {
    return api.request<Eligibility>({
      method: 'GET',
      path: '/credit/eligibility',
    })
  },

  requestCredit(input: RequestCreditInput): Promise<CreditRequest> {
    return api.request<CreditRequest>({
      method: 'POST',
      path: '/credit/request',
      body: { orderId: input.orderId, termMonths: input.termMonths },
      idempotencyKey: input.idempotencyKey,
    })
  },

  getCreditRequest(requestId: string): Promise<CreditRequest> {
    return api.request<CreditRequest>({
      method: 'GET',
      path: `/credit/requests/${requestId}`,
    })
  },

  getCreditRequests(query: CreditRequestsQuery = {}): Promise<Paginated<CreditRequest>> {
    return api.request<Paginated<CreditRequest>>({
      method: 'GET',
      path: '/credit/requests',
      query: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
      },
    })
  },

  getCredit(): Promise<Credit | null> {
    return api.request<Credit | null>({
      method: 'GET',
      path: '/credit',
    })
  },
}