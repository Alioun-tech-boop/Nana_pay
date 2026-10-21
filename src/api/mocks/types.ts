import type { HttpMethod } from '../transport'
import type { Merchant } from '../../types'

/**
 * Boutique telle que la représentent les données de démonstration.
 *
 * Le type `Merchant` du domaine est volontairement permissif (le backend réel
 * n'expose aujourd'hui que `id`, `name`, `slug`, `status`, `productCount`,
 * `createdAt`). Les mocks, eux, remplissent réellement tous les champs : ce type
 * le dit explicitement pour que tri et filtres restent sûrs côté mock, sans
 * forcer le domaine à déclarer obligatoire ce que l'API ne fournit pas.
 */
export type MockMerchant = Merchant & {
  category: string
  description: string
  city: string
  commune: string
  rating: number
  verified: boolean
  logo: string
  image: string
  identity: { monogram: string; accent: NonNullable<Merchant['identity']>['accent'] }
}

export interface MockContext {
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
  requestId: string
}

export interface MockResult {
  status: number
  data?: unknown
}

export type MockHandler = (context: MockContext) => MockResult

export interface MockRoute {
  method: HttpMethod
  pattern: string
  handler: MockHandler
}