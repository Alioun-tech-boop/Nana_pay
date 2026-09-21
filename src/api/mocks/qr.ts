import { notFound, ok, preconditionFailed, secondsAhead } from './helpers'
import type { MockRoute } from './types'

const orderId = 'ord_01HQRGEN'

const qrState: Record<string, number> = {}
const demoOrderIds = new Set(['ord_01HQRGEN'])

function elapsedSeconds(id: string): number {
  if (!qrState[id]) return 999
  return Math.floor((Date.now() - qrState[id]) / 1000)
}

function lifecycleState(id: string) {
  const elapsed = elapsedSeconds(id)
  if (elapsed >= 40) return { state: 'WITHDRAWN', until: null }
  if (elapsed >= 20) return { state: 'SCANNED', until: null }
  return { state: 'VALID', until: secondsAhead(1200) }
}

export const qrRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: '/orders/:id/qr',
    handler: (ctx) => {
      if (ctx.params.id !== orderId) {
        return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      }
      qrState[ctx.params.id] = Date.now()
      return ok({
        id: `qr_01HQRFULL${Date.now()}`,
        orderId,
        payload: 'data:image/png;base64,DEMO_QR_PAYLOAD',
        expiresAt: secondsAhead(1200),
        state: 'VALID',
      })
    },
  },
  {
    method: 'GET',
    pattern: '/orders/:id/qr',
    handler: (ctx) => {
      if (ctx.params.id !== orderId) {
        return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      }
      if (!qrState[ctx.params.id]) qrState[ctx.params.id] = Date.now()
      return ok({
        id: `qr_01HQRFULL${Date.now()}`,
        orderId,
        payload: 'data:image/png;base64,DEMO_QR_PAYLOAD',
        expiresAt: secondsAhead(1200),
        state: 'VALID',
      })
    },
  },
  {
    method: 'GET',
    pattern: '/orders/:id/qr/status',
    handler: (ctx) => {
      if (ctx.params.id !== orderId) {
        return notFound('ORDER_NOT_FOUND', 'Commande introuvable.')
      }
      const forced = ctx.query.state
      if (forced === 'EXPIRED') {
        return preconditionFailed('QR_EXPIRED', 'QR expiré', 'Ce QR n’est plus valide. Veuillez en générer un nouveau.')
      }
      if (forced) return ok(lifecycleState(ctx.params.id))
      if (ctx.params.id in qrState || !demoOrderIds.has(ctx.params.id)) {
        return ok(lifecycleState(ctx.params.id))
      }
      return ok({ state: 'VALID', until: secondsAhead(1200) })
    },
  },
]