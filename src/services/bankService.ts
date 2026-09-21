import { api } from '../api'
import type {
  BankClientProfile,
  BankClientProfileDetail,
  BankCredit,
  BankCreditRequest,
  BankCreditRequestDetail,
  BankOrder,
  BankSummary,
  BankTransfer,
  CreditDecision,
  CreditRequest,
  Paginated,
  Settlement,
} from '../types'

export interface BankCreditRequestsQuery {
  status?: string
  page?: number
  pageSize?: number
}

export interface BankListQuery {
  page?: number
  pageSize?: number
  status?: string
}

export interface BankProfilesQuery extends BankListQuery {
  q?: string
  riskLevel?: string
}

export interface DecisionInput extends CreditDecision {
  idempotencyKey: string
}

export const bankService = {
  getSummary(): Promise<BankSummary> {
    return api.request<BankSummary>({ method: 'GET', path: '/bank/summary' })
  },

  getProfiles(query: BankProfilesQuery = {}): Promise<Paginated<BankClientProfile>> {
    return api.request<Paginated<BankClientProfile>>({
      method: 'GET',
      path: '/bank/profiles',
      query: { page: query.page, pageSize: query.pageSize, q: query.q, riskLevel: query.riskLevel },
    })
  },

  getProfile(clientId: string): Promise<BankClientProfileDetail> {
    return api.request<BankClientProfileDetail>({ method: 'GET', path: `/bank/profiles/${clientId}` })
  },

  getCreditRequests(query: BankCreditRequestsQuery = {}): Promise<Paginated<BankCreditRequest>> {
    return api.request<Paginated<BankCreditRequest>>({
      method: 'GET',
      path: '/bank/credit-requests',
      query: { page: query.page, pageSize: query.pageSize, status: query.status },
    })
  },

  getCreditRequest(requestId: string): Promise<BankCreditRequestDetail> {
    return api.request<BankCreditRequestDetail>({
      method: 'GET',
      path: `/bank/credit-requests/${requestId}`,
    })
  },

  decideCreditRequest(requestId: string, input: DecisionInput): Promise<CreditRequest> {
    return api.request<CreditRequest>({
      method: 'POST',
      path: `/bank/credit-requests/${requestId}/decision`,
      body: { decision: input.decision, reason: input.reason },
      idempotencyKey: input.idempotencyKey,
    })
  },

  getCredits(query: BankListQuery = {}): Promise<Paginated<BankCredit>> {
    return api.request<Paginated<BankCredit>>({
      method: 'GET',
      path: '/bank/credits',
      query: { page: query.page, pageSize: query.pageSize, status: query.status },
    })
  },

  getTransfers(query: BankListQuery = {}): Promise<Paginated<BankTransfer>> {
    return api.request<Paginated<BankTransfer>>({
      method: 'GET',
      path: '/bank/transfers',
      query: { page: query.page, pageSize: query.pageSize, status: query.status },
    })
  },

  getOrders(query: { page?: number; pageSize?: number } = {}): Promise<Paginated<BankOrder>> {
    return api.request<Paginated<BankOrder>>({
      method: 'GET',
      path: '/bank/orders',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getSettlements(query: { page?: number; pageSize?: number } = {}): Promise<Paginated<Settlement>> {
    return api.request<Paginated<Settlement>>({
      method: 'GET',
      path: '/bank/settlements',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },
}
