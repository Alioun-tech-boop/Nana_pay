import type { Money } from './common'

export interface ProductImage {
  url: string
  width?: number
  height?: number
}

export interface ProductStock {
  available: boolean
  quantity: number
}

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export interface Product {
  id: string
  merchantId: string
  name: string
  description: string
  price: Money
  images: ProductImage[]
  categoryId: string | null
  stock: ProductStock
  financingEligible: boolean
  status: ProductStatus
}

export interface ProductQuery {
  page?: number
  pageSize?: number
  q?: string
  categoryId?: string
  merchantId?: string
}