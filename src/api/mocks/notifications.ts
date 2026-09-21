import { mockNotifications } from './db'
import { ok, paginate, parseQuery, secondsAgo } from './helpers'
import type { MockRoute } from './types'

export const notificationRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/notifications',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const sorted = [...mockNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return ok(paginate(sorted, page, pageSize))
    },
  },
  {
    method: 'POST',
    pattern: '/notifications/:id/read',
    handler: (ctx) => {
      const item = mockNotifications.find((notification) => notification.id === ctx.params.id)
      if (!item) return ok(null)
      item.read = true
      return ok({ ...item })
    },
  },
  {
    method: 'POST',
    pattern: '/notifications/read-all',
    handler: () => {
      for (const item of mockNotifications) item.read = true
      return ok({ updated: mockNotifications.length })
    },
  },
  {
    method: 'GET',
    pattern: '/notifications/summary',
    handler: () => ok({ unread: mockNotifications.filter((item) => !item.read).length }),
  },
]

export { secondsAgo }