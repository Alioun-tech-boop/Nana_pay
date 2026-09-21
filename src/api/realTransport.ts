import { getConfig } from '../lib/config'
import { AppError, AbortedError } from '../lib/errors'
import { buildQueryString } from '../lib/query'
import type { HttpMethod, Transport, TransportRequest, TransportResult } from './transport'

function linkSignals(external: AbortSignal | undefined, controller: AbortController): void {
  if (!external) return
  if (external.aborted) {
    controller.abort()
    return
  }
  external.addEventListener('abort', () => controller.abort(), { once: true })
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    const text = await response.text()
    return text || undefined
  }
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const realTransport: Transport = {
  async send(request: TransportRequest): Promise<TransportResult> {
    const { apiUrl, apiTimeoutMs } = getConfig()
    const url = `${apiUrl}${request.path}${buildQueryString(request.query)}`
    const controller = new AbortController()
    linkSignals(request.signal, controller)

    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, apiTimeoutMs)

    try {
      const response = await fetch(url, {
        method: request.method,
        headers: request.headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
        redirect: 'error',
      })
      const data = await readBody(response)
      return { status: response.status, data }
    } catch (error) {
      if (request.signal?.aborted) throw new AbortedError()
      if (timedOut) {
        throw new AppError({
          kind: 'timeout',
          requestId: request.requestId,
          title: 'Délai dépassé',
          detail: 'Le serveur met trop de temps à répondre.',
          cause: error,
        })
      }
      throw new AppError({
        kind: 'network',
        requestId: request.requestId,
        title: 'Connexion impossible',
        detail: 'Impossible de joindre le serveur.',
        cause: error,
      })
    } finally {
      clearTimeout(timer)
    }
  },
}

export type { HttpMethod }