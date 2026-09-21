import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRequest } from '../useRequest'
import { useMutation } from '../useMutation'
import { AppError } from '../../lib/errors'

describe('useRequest', () => {
  it('transitions idle → loading → success', async () => {
    const request = vi.fn(async () => ({ value: 42 }))
    const { result } = renderHook(() => useRequest(request, { deps: [] }))

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual({ value: 42 })
    expect(result.current.error).toBeNull()
  })

  it('transitions to error with AppError', async () => {
    const request = vi.fn(async () => {
      throw new AppError({ kind: 'server', status: 500 })
    })
    const onError = vi.fn()
    const { result } = renderHook(() => useRequest(request, { deps: [], onError }))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.kind).toBe('server')
    expect(onError).toHaveBeenCalled()
  })

  it('ignores stale results after unmount', async () => {
    let resolveFn: (value: unknown) => void = () => {}
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        }),
    )
    const { result, unmount } = renderHook(() => useRequest(request, { deps: [] }))

    unmount()
    await act(async () => {
      resolveFn({ value: 1 })
      await Promise.resolve()
    })

    expect(result.current.data).toBeUndefined()
  })

  it('does not run while disabled', async () => {
    const request = vi.fn(async () => ({ value: 1 }))
    const { result } = renderHook(() => useRequest(request, { deps: [], enabled: false }))

    expect(result.current.isIdle).toBe(true)
    expect(request).not.toHaveBeenCalled()
  })
})

describe('useMutation', () => {
  it('transitions idle → loading → success', async () => {
    const mutation = vi.fn(async () => 'done')
    const { result } = renderHook(() => useMutation(mutation))

    await act(async () => {
      await result.current.mutate()
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toBe('done')
  })

  it('maps thrown errors to AppError and calls onError', async () => {
    const onError = vi.fn()
    const mutation = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useMutation(mutation, { onError }))

    await act(async () => {
      await result.current.mutate()
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBeInstanceOf(AppError)
    expect(onError).toHaveBeenCalledOnce()
  })

  it('blocks concurrent duplicate calls (double-click protection)', async () => {
    let release: (() => void) | null = null
    const mutation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve('ok')
        }),
    )
    const { result } = renderHook(() => useMutation(mutation))

    let first: Promise<unknown>
    let second: Promise<unknown>
    act(() => {
      first = result.current.mutate()
      second = result.current.mutate()
    })

    await act(async () => {
      release?.()
      await Promise.all([first, second])
    })

    expect(mutation).toHaveBeenCalledTimes(1)
    expect(result.current.isSuccess).toBe(true)
  })

  it('reset clears data and status', async () => {
    const mutation = vi.fn(async () => 'x')
    const { result } = renderHook(() => useMutation(mutation))

    await act(async () => {
      await result.current.mutate()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})