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

export interface ConfigureVaultPlanInput {
  /** Montant prélevé chaque mois sur le salaire, saisi par le client ; validé par le backend. */
  monthlyAmount: number
  /** Somme visée (« objectif ») du coffre, saisie par le client ; validée par le backend. */
  targetAmount: number
  idempotencyKey: string
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

  configurePlan(input: ConfigureVaultPlanInput): Promise<Vault> {
    return api.request<Vault>({
      method: 'PUT',
      path: '/vault/plan',
      body: {
        monthlyAmount: input.monthlyAmount,
        targetAmount: input.targetAmount,
      },
      idempotencyKey: input.idempotencyKey,
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