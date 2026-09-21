import { getConfig } from '../lib/config'
import { AbortedError, AppError } from '../lib/errors'
import { matchMockRoute } from './mocks'
import { parseQuery } from './mocks/helpers'
import type { Transport, TransportRequest, TransportResult } from './transport'

function sleep(delayMs: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, delayMs)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new AbortedError())
    }
    if (signal?.aborted) {
      clearTimeout(timer)
      reject(new AbortedError())
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export const mockTransport: Transport = {
  async send(request: TransportRequest): Promise<TransportResult> {
    const cleanPath = request.path.split('?')[0]
    const match = matchMockRoute(request.method, cleanPath)
    if (!match) {
      throw new AppError({
        kind: 'not-found',
        status: 404,
        requestId: request.requestId,
        code: 'ROUTE_NOT_MOCKED',
        title: 'Aucun mock défini',
        detail: `Aucun mock enregistré pour ${request.method} ${cleanPath}.`,
      })
    }
    await sleep(getConfig().mockDelayMs, request.signal)
    const result = match.handler({
      params: match.params,
      query: parseQuery(request.query),
      body: request.body,
      headers: request.headers,
      requestId: request.requestId,
    })
    return { status: result.status, data: result.data }
  },
}