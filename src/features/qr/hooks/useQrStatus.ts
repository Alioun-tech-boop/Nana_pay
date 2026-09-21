import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, isAbortedError, toAppError } from '../../../lib/errors'
import { qrService } from '../../../services/qrService'
import type { QrState, QrStatus } from '../../../types'

const TERMINAL_STATES: ReadonlySet<QrState> = new Set(['WITHDRAWN', 'SETTLED', 'EXPIRED'])

export interface UseQrStatusOptions {
  enabled?: boolean
  intervalMs?: number
  maxPolls?: number
  onStateChange?: (status: QrStatus) => void
}

export interface UseQrStatusResult {
  status: QrStatus | null
  error: AppError | null
  loading: boolean
  polls: number
  refresh: () => void
}

export function useQrStatus(
  orderId: string,
  options: UseQrStatusOptions = {},
): UseQrStatusResult {
  const { enabled = true, intervalMs = 5000, maxPolls = 30, onStateChange } = options
  const [status, setStatus] = useState<QrStatus | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState(false)
  const [polls, setPolls] = useState(0)

  const stopRef = useRef(false)
  const pollsRef = useRef(0)
  const mountedRef = useRef(true)
  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  const poll = useCallback(async () => {
    if (stopRef.current) return
    setLoading(true)
    setError(null)
    try {
      const next = await qrService.getQrStatus(orderId)
      if (stopRef.current || !mountedRef.current) return
      setStatus(next)
      pollsRef.current += 1
      setPolls(pollsRef.current)
      onStateChangeRef.current?.(next)
      if (TERMINAL_STATES.has(next.state)) stopRef.current = true
    } catch (caught) {
      if (isAbortedError(caught) || stopRef.current || !mountedRef.current) return
      setError(toAppError(caught))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [orderId])

  const refresh = useCallback(() => {
    stopRef.current = false
    void poll()
  }, [poll])

  useEffect(() => {
    mountedRef.current = true
    stopRef.current = false
    pollsRef.current = 0
    setPolls(0)
    setStatus(null)
    setError(null)

    if (!enabled) return

    void poll()
    const timer = setInterval(() => {
      if (stopRef.current || pollsRef.current >= maxPolls) {
        clearInterval(timer)
        return
      }
      void poll()
    }, intervalMs)

    return () => {
      mountedRef.current = false
      stopRef.current = true
      clearInterval(timer)
    }
  }, [enabled, orderId, maxPolls, intervalMs, poll])

  return { status, error, loading, polls, refresh }
}