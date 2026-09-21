import type { ServerDate } from './common'

export const MERCHANT_ACCENTS = ['brand', 'gold', 'success', 'warning', 'danger', 'ink'] as const

export type MerchantAccent = (typeof MERCHANT_ACCENTS)[number]

export interface Merchant {
  id: string
  name: string
  slug: string
  category: string
  description: string
  city: string
  commune: string
  rating: number
  verified: boolean
  createdAt: ServerDate
  logo: string
  image: string
  identity: {
    monogram: string
    accent: MerchantAccent
  }
}

export interface MerchantQuery {
  q?: string
  city?: string
  commune?: string
  page?: number
  pageSize?: number
}

export interface MerchantMeta {
  cities: string[]
  communes: Record<string, string[]>
}