export type RequestLogEntry = {
  requestId: string
  method: string
  path: string
  status?: number
  durationMs: number
  cached?: boolean
}

type RequestLogger = (entry: RequestLogEntry) => void

let logger: RequestLogger | null = null

export function setRequestLogger(next: RequestLogger | null): void {
  logger = next
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const hex = () => Math.floor(Math.random() * 16).toString(16)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = token === 'x' ? hex() : (Number.parseInt(hex(), 16) & 3) | 8
    return value.toString(16)
  })
}

export function createRequestId(): string {
  return `np_${uuid()}`
}

export function createOperationId(): string {
  return uuid()
}

export function logRequest(entry: RequestLogEntry): void {
  logger?.(entry)
}