import { mockProducts } from './db'
import { notFound, ok, paginate, parseQuery } from './helpers'
import type { MockRoute } from './types'

export const productRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/products',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      let filtered = mockProducts
      const search = (query.q ?? '').trim().toLowerCase()
      if (search) filtered = filtered.filter((product) => product.name.toLowerCase().includes(search))
      if (query.merchantId) {
        filtered = filtered.filter((product) => product.merchantId === query.merchantId)
      }
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      return ok(paginate(sorted, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/products/:id',
    handler: (ctx) => {
      const product = mockProducts.find((item) => item.id === ctx.params.id)
      if (!product) return notFound('PRODUCT_NOT_FOUND', 'Produit introuvable.')
      return ok(product)
    },
  },
]