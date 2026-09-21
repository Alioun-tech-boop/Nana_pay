import { api } from '../api'
import type { Merchant, MerchantMeta, MerchantQuery, Paginated, Product, ProductQuery } from '../types'

export const marketplaceService = {
  getProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
    return api.request<Paginated<Product>>({
      method: 'GET',
      path: '/products',
      query: {
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        categoryId: query.categoryId,
        merchantId: query.merchantId,
      },
    })
  },

  getProduct(productId: string): Promise<Product> {
    return api.request<Product>({
      method: 'GET',
      path: `/products/${productId}`,
    })
  },

  getMerchants(query: MerchantQuery = {}): Promise<Paginated<Merchant>> {
    return api.request<Paginated<Merchant>>({
      method: 'GET',
      path: '/merchants',
      query: {
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        city: query.city,
        commune: query.commune,
      },
      cache: { ttlMs: 60_000 },
    })
  },

  getMerchant(merchantId: string): Promise<Merchant> {
    return api.request<Merchant>({
      method: 'GET',
      path: `/merchants/${merchantId}`,
      cache: { ttlMs: 60_000 },
    })
  },

  getMerchantMeta(): Promise<MerchantMeta> {
    return api.request<MerchantMeta>({
      method: 'GET',
      path: '/merchants/meta',
      cache: { ttlMs: 60_000 },
    })
  },

  getMerchantProducts(merchantId: string, query: ProductQuery = {}): Promise<Paginated<Product>> {
    return this.getProducts({ ...query, merchantId })
  },
}

export type { MerchantQuery, Merchant, ProductQuery }