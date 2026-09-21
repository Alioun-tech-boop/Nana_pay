import type { HttpMethod } from '../transport'

export interface MockContext {
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
  requestId: string
}

export interface MockResult {
  status: number
  data?: unknown
}

export type MockHandler = (context: MockContext) => MockResult

export interface MockRoute {
  method: HttpMethod
  pattern: string
  handler: MockHandler
}