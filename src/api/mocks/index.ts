import type { HttpMethod } from '../transport'
import { authRoutes } from './auth'
import { bankAdminRoutes } from './bankAdmin'
import { financingRoutes } from './financing'
import { historyRoutes } from './history'
import { merchantRoutes } from './merchant'
import { merchantRoutes as marketplaceMerchantRoutes } from './merchants'
import { notificationRoutes } from './notifications'
import { orderRoutes } from './orders'
import { productRoutes } from './products'
import { qrRoutes } from './qr'
import type { MockHandler, MockRoute } from './types'

const routes: MockRoute[] = [
  ...authRoutes,
  ...productRoutes,
  ...marketplaceMerchantRoutes,
  ...orderRoutes,
  ...financingRoutes,
  ...qrRoutes,
  ...historyRoutes,
  ...merchantRoutes,
  ...notificationRoutes,
  ...bankAdminRoutes,
]

interface MatchResult {
  handler: MockHandler
  params: Record<string, string>
}

export function matchMockRoute(method: HttpMethod, path: string): MatchResult | null {
  const pathSegments = path.split('/').filter(Boolean)
  for (const route of routes) {
    if (route.method !== method) continue
    const patternSegments = route.pattern.split('/').filter(Boolean)
    if (patternSegments.length !== pathSegments.length) continue
    const params: Record<string, string> = {}
    let matches = true
    for (let index = 0; index < patternSegments.length; index += 1) {
      const patternSegment = patternSegments[index]
      const pathSegment = pathSegments[index]
      if (patternSegment.startsWith(':')) {
        params[patternSegment.slice(1)] = pathSegment
        continue
      }
      if (patternSegment !== pathSegment) {
        matches = false
        break
      }
    }
    if (matches) return { handler: route.handler, params }
  }
  return null
}

export function mockHasRoute(method: HttpMethod, path: string): boolean {
  return matchMockRoute(method, path) !== null
}