import { useCallback, useRef, useState } from 'react'
import { AppError, isAbortedError, toAppError } from '../lib/errors'

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseMutationOptions<TData> {
  onSuccess?: (data: TData) => void
  onError?: (error: AppError) => void
}

export interface UseMutationResult<TData, TArgs extends unknown[]> {
  mutate: (...args: TArgs) => Promise<TData | undefined>
  status: MutationStatus
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: AppError | null
  data: TData | undefined
  reset: () => void
}

export function useMutation<TData, TArgs extends unknown[]>(
  mutation: (...args: TArgs) => Promise<TData>,
  options: UseMutationOptions<TData> = {},
): UseMutationResult<TData, TArgs> {
  const [data, setData] = useState<TData | undefined>(undefined)
  const [error, setError] = useState<AppError | null>(null)
  const [status, setStatus] = useState<MutationStatus>('idle')

  const busyRef = useRef(false)
  const mutationRef = useRef(mutation)
  mutationRef.current = mutation
  const onSuccessRef = useRef(options.onSuccess)
  onSuccessRef.current = options.onSuccess
  const onErrorRef = useRef(options.onError)
  onErrorRef.current = options.onError

  const mutate = useCallback(async (...args: TArgs): Promise<TData | undefined> => {
    if (busyRef.current) return undefined
    busyRef.current = true
    setStatus('loading')
    setError(null)
    try {
      const result = await mutationRef.current(...args)
      setData(result)
      setStatus('success')
      onSuccessRef.current?.(result)
      return result
    } catch (caught) {
      if (isAbortedError(caught)) return undefined
      const appError = toAppError(caught)
      setError(appError)
      setStatus('error')
      onErrorRef.current?.(appError)
      return undefined
    } finally {
      busyRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    setData(undefined)
    setError(null)
    setStatus('idle')
  }, [])

  return {
    mutate,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    data,
    reset,
  }
}