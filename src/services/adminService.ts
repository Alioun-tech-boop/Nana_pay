import { api } from '../api'
import type {
  AdminCreditSummary,
  AdminKycRecord,
  AdminMerchant,
  AdminOrderSummary,
  AdminPaymentSummary,
  AdminQrRecord,
  AdminSavingsSummary,
  AdminSettlementRecord,
  AdminSummary,
  AdminTransactionRecord,
  AdminUser,
  AdminVaultSummary,
  AdminWithdrawalRecord,
  AuditEntry,
  Paginated,
} from '../types'

export interface AdminPageQuery {
  page?: number
  pageSize?: number
  status?: string
  type?: string
}

export const adminService = {
  getSummary(): Promise<AdminSummary> {
    return api.request<AdminSummary>({ method: 'GET', path: '/admin/summary' })
  },

  getUsers(query: AdminPageQuery = {}): Promise<Paginated<AdminUser>> {
    return api.request<Paginated<AdminUser>>({
      method: 'GET',
      path: '/admin/users',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getMerchants(query: AdminPageQuery = {}): Promise<Paginated<AdminMerchant>> {
    return api.request<Paginated<AdminMerchant>>({
      method: 'GET',
      path: '/admin/merchants',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getOrders(query: AdminPageQuery = {}): Promise<Paginated<AdminOrderSummary>> {
    return api.request<Paginated<AdminOrderSummary>>({
      method: 'GET',
      path: '/admin/orders',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getPayments(query: AdminPageQuery = {}): Promise<Paginated<AdminPaymentSummary>> {
    return api.request<Paginated<AdminPaymentSummary>>({
      method: 'GET',
      path: '/admin/payments',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getCredits(query: AdminPageQuery = {}): Promise<Paginated<AdminCreditSummary>> {
    return api.request<Paginated<AdminCreditSummary>>({
      method: 'GET',
      path: '/admin/credits',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getKyc(query: AdminPageQuery = {}): Promise<Paginated<AdminKycRecord>> {
    return api.request<Paginated<AdminKycRecord>>({
      method: 'GET',
      path: '/admin/kyc',
      query: { page: query.page, pageSize: query.pageSize, status: query.status },
    })
  },

  getSavings(query: AdminPageQuery = {}): Promise<Paginated<AdminSavingsSummary>> {
    return api.request<Paginated<AdminSavingsSummary>>({
      method: 'GET',
      path: '/admin/savings',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getVaults(query: AdminPageQuery = {}): Promise<Paginated<AdminVaultSummary>> {
    return api.request<Paginated<AdminVaultSummary>>({
      method: 'GET',
      path: '/admin/vaults',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getQr(query: AdminPageQuery = {}): Promise<Paginated<AdminQrRecord>> {
    return api.request<Paginated<AdminQrRecord>>({
      method: 'GET',
      path: '/admin/qr',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getWithdrawals(query: AdminPageQuery = {}): Promise<Paginated<AdminWithdrawalRecord>> {
    return api.request<Paginated<AdminWithdrawalRecord>>({
      method: 'GET',
      path: '/admin/withdrawals',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getSettlements(query: AdminPageQuery = {}): Promise<Paginated<AdminSettlementRecord>> {
    return api.request<Paginated<AdminSettlementRecord>>({
      method: 'GET',
      path: '/admin/settlements',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getTransactions(query: AdminPageQuery = {}): Promise<Paginated<AdminTransactionRecord>> {
    return api.request<Paginated<AdminTransactionRecord>>({
      method: 'GET',
      path: '/admin/transactions',
      query: { page: query.page, pageSize: query.pageSize, type: query.type, status: query.status },
    })
  },

  getAudit(query: AdminPageQuery = {}): Promise<Paginated<AuditEntry>> {
    return api.request<Paginated<AuditEntry>>({
      method: 'GET',
      path: '/admin/audit',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },
}
