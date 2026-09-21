import type { QueryValue } from '../../lib/query'
import type { ApiErrorPayload, Pagination } from '../../types'
import type { MockResult } from './types'

export function secondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

export function secondsAhead(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

export function daysAhead(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

export function ok<T>(data: T, status = 200): MockResult {
  return { status, data }
}

export function created<T>(data: T): MockResult {
  return { status: 201, data }
}

export function accepted<T>(data: T): MockResult {
  return { status: 202, data }
}

export function noContent(): MockResult {
  return { status: 204 }
}

export function mockError(
  status: number,
  code: string,
  title: string,
  detail = '',
  field: string | null = null,
): MockResult {
  const payload: ApiErrorPayload = { code, title, detail, field }
  return { status, data: payload }
}

export function badRequest(code: string, title: string, detail = '', field: string | null = null): MockResult {
  return mockError(400, code, title, detail, field)
}

export function unauthorized(detail = ''): MockResult {
  return mockError(401, 'UNAUTHORIZED', 'Non authentifié', detail)
}

export function forbidden(detail = ''): MockResult {
  return mockError(403, 'FORBIDDEN', 'Accès refusé', detail)
}

export function notFound(code: string, title: string): MockResult {
  return mockError(404, code, title)
}

export function conflict(code: string, title: string, detail = ''): MockResult {
  return mockError(409, code, title, detail)
}

export function preconditionFailed(code: string, title: string, detail = ''): MockResult {
  return mockError(412, code, title, detail)
}

export function businessRule(code: string, title: string, detail = '', field: string | null = null): MockResult {
  return mockError(422, code, title, detail, field)
}

export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; pagination: Pagination } {
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1)
  const safeSize = Math.max(1, Number.isFinite(pageSize) ? pageSize : 25)
  const start = (safePage - 1) * safeSize
  const slice = items.slice(start, start + safeSize)
  return {
    items: slice,
    pagination: {
      page: safePage,
      pageSize: safeSize,
      total: items.length,
      hasMore: start + slice.length < items.length,
    },
  }
}

export function parseQuery(
  query: Record<string, QueryValue | QueryValue[]> | undefined,
): Record<string, string> {
  if (!query) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first === undefined) continue
    out[key] = String(first)
  }
  return out
}

export function bodyOf(ctx: { body: unknown }): Record<string, unknown> {
  if (!ctx.body || typeof ctx.body !== 'object') return {}
  return ctx.body as Record<string, unknown>
}