import { getConfig } from '../lib/config'
import {
  AppError,
  isAbortedError,
  isAppError,
  mapStatusKind,
  toApiErrorBody,
  toAppError,
} from '../lib/errors'
import { buildQueryString, type QueryValue } from '../lib/query'
import { createRequestId, logRequest } from '../lib/request-id'
import { mockTransport } from './mockTransport'
import { realTransport } from './realTransport'
import type { HttpMethod, Transport } from './transport'

export interface RequestConfig {
  method: HttpMethod
  path: string
  query?: Record<string, QueryValue | QueryValue[]>
  body?: unknown
  auth?: boolean
  idempotencyKey?: string
  signal?: AbortSignal
  validate?: (data: unknown) => unknown
  cache?: { ttlMs: number }
}

export interface CacheEntry {
  value: unknown
  expiresAt: number
}

export type RefreshOutcome = 'refreshed' | 'failed'

export interface Refresher {
  (): Promise<RefreshOutcome>
}

export interface ApiClient {
  request<T>(config: RequestConfig): Promise<T>
  setTokenProvider: (provider: () => string | null) => void
  setRefreshProvider: (provider: Refresher) => void
  setAuthenticationFailureHandler: (handler: (requestId: string) => void) => void
  setTransportForTests: (transport: Transport) => void
  isMockMode: () => boolean
  invalidateCache: (pathPrefix: string) => void
  clearCache: () => void
}

let tokenProvider: () => string | null = () => null
let refreshProvider: Refresher = async () => 'failed'
let authenticationFailureHandler: (requestId: string) => void = () => {}
let activeTransport: Transport | null = null
const getCache = new Map<string, CacheEntry>()

function cacheKey(method: HttpMethod, path: string, query: Record<string, unknown> | undefined): string {
  return `${method} ${path}${buildQueryString(query as Record<string, QueryValue | QueryValue[]> | undefined)}`
}

function readCache<T>(config: RequestConfig): { hit: true; value: T } | undefined {
  if (config.method !== 'GET' || !config.cache) return undefined
  const key = cacheKey(config.method, config.path, config.query)
  const entry = getCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    getCache.delete(key)
    return undefined
  }
  return { hit: true, value: entry.value as T }
}

function writeCache(config: RequestConfig, value: unknown): void {
  if (config.method !== 'GET' || !config.cache) return
  getCache.set(cacheKey(config.method, config.path, config.query), {
    value,
    expiresAt: Date.now() + config.cache.ttlMs,
  })
}

function resolveTransport(): Transport {
  if (activeTransport) return activeTransport
  const { apiMode } = getConfig()
  return apiMode === 'real' ? realTransport : mockTransport
}

function buildError(status: number, data: unknown, requestId: string): AppError {
  const payload = toApiErrorBody(data)
  return new AppError({
    kind: mapStatusKind(status),
    status,
    code: payload?.code ?? null,
    title: payload?.title ?? null,
    detail: payload?.detail ?? null,
    field: payload?.field ?? null,
    requestId,
  })
}

export const api: ApiClient = {
  async request<T>(config: RequestConfig): Promise<T> {
    const appConfig = getConfig()
    const requestId = createRequestId()
    const startedAt = Date.now()
    const transport = resolveTransport()

    const cached = readCache<T>(config)
    if (cached) {
      logRequest({
        requestId,
        method: config.method,
        path: config.path,
        status: 0,
        durationMs: Date.now() - startedAt,
        cached: true,
      })
      return cached.value
    }

    const buildHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = {
        'Accept-Language': appConfig.locale,
        'X-Request-Id': requestId,
      }
      if (config.body !== undefined && config.method !== 'GET') {
        headers['Content-Type'] = 'application/json'
      }
      if (config.idempotencyKey) {
        headers['Idempotency-Key'] = config.idempotencyKey
      }
      if (config.auth !== false) {
        const token = tokenProvider()
        if (token) headers['Authorization'] = `Bearer ${token}`
      }
      return headers
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await transport.send({
          method: config.method,
          path: config.path,
          query: config.query,
          body: config.body,
          headers: buildHeaders(),
          signal: config.signal,
          timeoutMs: appConfig.apiTimeoutMs,
          requestId,
        })
        logRequest({
          requestId,
          method: config.method,
          path: config.path,
          status: result.status,
          durationMs: Date.now() - startedAt,
        })

        if (result.status >= 200 && result.status < 300) {
          const data = config.validate ? (config.validate(result.data) as T) : (result.data as T)
          writeCache(config, data)
          return data
        }

        if (result.status === 401 && attempt === 0 && config.auth !== false) {
          const outcome = await refreshProvider()
          if (outcome === 'refreshed') continue
        }

        const error = buildError(result.status, result.data, requestId)
        if (error.kind === 'unauthorized' && config.auth !== false) {
          authenticationFailureHandler(requestId)
        }
        throw error
      } catch (error) {
        if (isAbortedError(error)) throw error
        if (isAppError(error)) {
          if (error.requestId === null) throw new AppError({ ...error, requestId })
          throw error
        }
        throw toAppError(error, requestId)
      }
    }

    throw new AppError({ kind: 'unknown', requestId, title: 'Impossible de terminer la requête.' })
  },

  setTokenProvider(provider) {
    tokenProvider = provider
  },

  setRefreshProvider(provider) {
    refreshProvider = provider
  },

  setAuthenticationFailureHandler(handler) {
    authenticationFailureHandler = handler
  },

  setTransportForTests(transport) {
    activeTransport = transport
  },

  isMockMode() {
    return getConfig().apiMode === 'mock'
  },

  invalidateCache(pathPrefix: string) {
    for (const key of getCache.keys()) {
      const [, path] = key.split(' ')
      if (path.startsWith(pathPrefix)) getCache.delete(key)
    }
  },

  clearCache() {
    getCache.clear()
  },
}

export type { HttpMethod, Transport }