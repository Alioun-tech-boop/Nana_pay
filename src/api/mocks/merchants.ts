import { mockMerchants } from './db'
import { notFound, ok, paginate, parseQuery } from './helpers'
import type { MockRoute } from './types'

export const merchantRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/merchants/meta',
    handler: () => {
      const cities = [...new Set(mockMerchants.map((merchant) => merchant.city))].sort()
      const communes = cities.reduce<Record<string, string[]>>((acc, city) => {
        acc[city] = [...new Set(mockMerchants.filter((m) => m.city === city).map((m) => m.commune))].sort()
        return acc
      }, {})
      return ok({ cities, communes })
    },
  },
  {
    method: 'GET',
    pattern: '/merchants',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const search = (query.q ?? '').trim().toLowerCase()
      const filtered = mockMerchants.filter((merchant) => {
        if (query.city && merchant.city !== query.city) return false
        if (query.commune && merchant.commune !== query.commune) return false
        if (search) {
          const haystack = `${merchant.name} ${merchant.category} ${merchant.description}`.toLowerCase()
          if (!haystack.includes(search)) return false
        }
        return true
      })
      const sorted = [...filtered].sort((a, b) => b.rating - a.rating)
      return ok(paginate(sorted, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/merchants/:id',
    handler: (ctx) => {
      const merchant = mockMerchants.find((item) => item.id === ctx.params.id)
      if (!merchant) return notFound('MERCHANT_NOT_FOUND', 'Boutique introuvable.')
      return ok(merchant)
    },
  },
]