import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, isAbortedError, toAppError } from '../lib/errors'

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseRequestOptions {
  enabled?: boolean
  deps?: readonly unknown[]
  onError?: (error: AppError) => void
}

export interface UseRequestResult<T> {
  data: T | undefined
  error: AppError | null
  status: RequestStatus
  requestId: string | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  execute: (signal?: AbortSignal) => Promise<void>
  refresh: (signal?: AbortSignal) => Promise<void>
}

export function useRequest<T>(
  request: (signal?: AbortSignal) => Promise<T>,
  options: UseRequestOptions = {},
): UseRequestResult<T> {
  const { enabled = true, deps = [], onError } = options
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<AppError | null>(null)
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)
  const requestRef = useRef(request)
  requestRef.current = request
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const execute = useCallback(async (signal?: AbortSignal) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort, { once: true })
    abortRef.current = controller
    const runId = runIdRef.current + 1
    runIdRef.current = runId

    setStatus('loading')
    setError(null)
    setRequestId(null)

    try {
      const result = await requestRef.current(controller.signal)
      if (runId !== runIdRef.current || !mountedRef.current) return
      setData(result)
      setStatus('success')
    } catch (caught) {
      if (isAbortedError(caught) || runId !== runIdRef.current || !mountedRef.current) return
      const appError = toAppError(caught)
      setRequestId(appError.requestId)
      setError(appError)
      setStatus('error')
      onErrorRef.current?.(appError)
    } finally {
      signal?.removeEventListener('abort', onAbort)
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [])

  const refresh = useCallback(
    (signal?: AbortSignal) => execute(signal),
    [execute],
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      return
    }
    void execute()
    return () => {
      if (enabled) abortRef.current?.abort()
    }
  }, [enabled, execute, ...deps])

  return {
    data,
    error,
    status,
    requestId,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    refresh,
  }
}