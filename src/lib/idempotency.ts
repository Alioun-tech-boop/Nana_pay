import { createOperationId } from './request-id'

export function createIdempotencyKey(): string {
  return createOperationId()
}

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128
}