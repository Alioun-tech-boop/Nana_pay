import { api } from '../api'
import type {
  CreateMerchantProductInput,
  MerchantOrderDetail,
  MerchantPayment,
  MerchantProduct,
  MerchantScanResult,
  MerchantStore,
  MerchantSummary,
  MerchantTransaction,
  Paginated,
  UpdateMerchantProductInput,
  WithdrawalMethod,
} from '../types'

export interface MerchantScanInput {
  payload: string
  idempotencyKey: string
}

export interface MerchantOrdersQuery {
  page?: number
  pageSize?: number
  status?: string
}

export interface MerchantProductsQuery {
  page?: number
  pageSize?: number
  q?: string
  status?: string
}

export interface MerchantListQuery {
  page?: number
  pageSize?: number
}

export interface UpdateMerchantStoreInput {
  name?: string
  description?: string
  category?: string
  city?: string
  commune?: string
  phone?: string
  email?: string
}

export interface SettleInput {
  orderId: string
  idempotencyKey: string
}

export const merchantService = {
  getSummary(): Promise<MerchantSummary> {
    return api.request<MerchantSummary>({ method: 'GET', path: '/merchant/summary' })
  },

  getStore(): Promise<MerchantStore> {
    return api.request<MerchantStore>({ method: 'GET', path: '/merchant/store' })
  },

  updateStore(input: UpdateMerchantStoreInput): Promise<MerchantStore> {
    return api.request<MerchantStore>({ method: 'PATCH', path: '/merchant/store', body: input })
  },

  getStoreProducts(query: MerchantProductsQuery = {}): Promise<Paginated<MerchantProduct>> {
    return api.request<Paginated<MerchantProduct>>({
      method: 'GET',
      path: '/merchant/products',
      query: { page: query.page, pageSize: query.pageSize, q: query.q, status: query.status },
    })
  },

  getProduct(productId: string): Promise<MerchantProduct> {
    return api.request<MerchantProduct>({ method: 'GET', path: `/merchant/products/${productId}` })
  },

  createProduct(input: CreateMerchantProductInput): Promise<MerchantProduct> {
    return api.request<MerchantProduct>({ method: 'POST', path: '/merchant/products', body: input })
  },

  updateProduct(productId: string, input: UpdateMerchantProductInput): Promise<MerchantProduct> {
    return api.request<MerchantProduct>({
      method: 'PATCH',
      path: `/merchant/products/${productId}`,
      body: input,
    })
  },

  getOrders(query: MerchantOrdersQuery = {}): Promise<Paginated<MerchantOrderDetail>> {
    return api.request<Paginated<MerchantOrderDetail>>({
      method: 'GET',
      path: '/merchant/orders',
      query: { page: query.page, pageSize: query.pageSize, status: query.status },
    })
  },

  getOrder(orderId: string): Promise<MerchantOrderDetail> {
    return api.request<MerchantOrderDetail>({ method: 'GET', path: `/merchant/orders/${orderId}` })
  },

  scanQr(input: MerchantScanInput): Promise<MerchantScanResult> {
    return api.request<MerchantScanResult>({
      method: 'POST',
      path: '/merchant/scan',
      body: { payload: input.payload },
      idempotencyKey: input.idempotencyKey,
    })
  },

  getPayments(query: MerchantListQuery = {}): Promise<Paginated<MerchantPayment>> {
    return api.request<Paginated<MerchantPayment>>({
      method: 'GET',
      path: '/merchant/payments',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getTransactions(query: MerchantListQuery = {}): Promise<Paginated<MerchantTransaction>> {
    return api.request<Paginated<MerchantTransaction>>({
      method: 'GET',
      path: '/merchant/transactions',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  getBalance(): Promise<{ amount: number; currency: string }> {
    return api.request<{ amount: number; currency: string }>({
      method: 'GET',
      path: '/merchant/balance',
    })
  },

  settle(input: SettleInput): Promise<{ accepted: boolean }> {
    return api.request<{ accepted: boolean }>({
      method: 'POST',
      path: '/merchant/settle',
      body: { orderId: input.orderId },
      idempotencyKey: input.idempotencyKey,
    })
  },
}

export type { WithdrawalMethod }
