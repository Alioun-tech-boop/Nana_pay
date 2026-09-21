import { api } from '../api'
import type { Paginated, Vault, VaultTransaction } from '../types'

export interface UseVaultInput {
  orderId: string
  idempotencyKey: string
}

export interface VaultTransactionsQuery {
  page?: number
  pageSize?: number
}

export interface UseVaultResult {
  used: boolean
  orderId: string
}

export const vaultService = {
  getVault(): Promise<Vault> {
    return api.request<Vault>({
      method: 'GET',
      path: '/vault',
    })
  },

  getTransactions(query: VaultTransactionsQuery = {}): Promise<Paginated<VaultTransaction>> {
    return api.request<Paginated<VaultTransaction>>({
      method: 'GET',
      path: '/vault/transactions',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  useVault(input: UseVaultInput): Promise<UseVaultResult> {
    return api.request<UseVaultResult>({
      method: 'POST',
      path: '/vault/use',
      body: { orderId: input.orderId },
      idempotencyKey: input.idempotencyKey,
    })
  },
}