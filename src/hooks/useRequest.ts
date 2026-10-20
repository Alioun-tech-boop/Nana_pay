import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, isAbortedError, toAppError } from '../lib/errors'

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error' | 'unavailable'

export interface UseRequestOptions {
  enabled?: boolean
  deps?: readonly unknown[]
  onError?: (error: AppError) => void
  /**
   * Requête non critique dont l'absence de contrat backend est attendue.
   *
   * Quand un module n'est pas encore implémenté côté backend, l'endpoint renvoie
   * 404 (`AGENTS.md` §21 : ne jamais prétendre qu'un endpoint existe). Une donnée
   * purement indicative — un compteur de notifications, par exemple — ne doit pas
   * pour autant apparaître comme une erreur applicative. Avec `optional`, un 404
   * ou un 501 est traité comme « fonctionnalité indisponible » : l'état devient
   * `unavailable` et le rendu retombe sur une valeur neutre.
   *
   * Les autres erreurs (réseau, autorisation, serveur) restent de vraies erreurs.
   */
  optional?: boolean
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
  /** Endpoint pas encore implémenté côté backend (voir `optional`). */
  isUnavailable: boolean
  execute: (signal?: AbortSignal) => Promise<void>
  refresh: (signal?: AbortSignal) => Promise<void>
}

export function useRequest<T>(
  request: (signal?: AbortSignal) => Promise<T>,
  options: UseRequestOptions = {},
): UseRequestResult<T> {
  const { enabled = true, deps = [], onError, optional = false } = options
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
      if (optional && (appError.kind === 'not-found' || appError.status === 501)) {
        // Fonctionnalité non disponible : ni erreur, ni donnée. L'appelant
        // décide d'afficher une valeur neutre plutôt qu'un message d'échec.
        setData(undefined)
        setError(null)
        setRequestId(null)
        setStatus('unavailable')
        return
      }
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
    isUnavailable: status === 'unavailable',
    execute,
    refresh,
  }
}