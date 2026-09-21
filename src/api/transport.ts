import type { QueryValue } from '../lib/query'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface TransportHeaders {
  [name: string]: string
}

export interface TransportRequest {
  method: HttpMethod
  path: string
  query?: Record<string, QueryValue | QueryValue[]>
  body?: unknown
  headers: TransportHeaders
  signal?: AbortSignal
  timeoutMs: number
  requestId: string
}

export interface TransportResult {
  status: number
  data: unknown
}

export interface Transport {
  send(request: TransportRequest): Promise<TransportResult>
}