import { useRef } from 'react'
import { createIdempotencyKey } from '../lib/idempotency'

export function useIdempotencyKey(): string {
  const keyRef = useRef<string | null>(null)
  if (keyRef.current === null) {
    keyRef.current = createIdempotencyKey()
  }
  return keyRef.current
}

export function useFreshIdempotencyKey(seed: unknown): string {
  const keyRef = useRef<{ seed: unknown; key: string } | null>(null)
  if (keyRef.current === null || keyRef.current.seed !== seed) {
    keyRef.current = { seed, key: createIdempotencyKey() }
  }
  return keyRef.current.key
}