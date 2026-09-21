import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

export interface UseAnimatedNumberOptions {
  duration?: number
  disabled?: boolean
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useAnimatedNumber(
  value: number,
  { duration = 450, disabled = false }: UseAnimatedNumberOptions = {},
): number {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const current = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || reduced || disabled) {
      current.current = value
      setDisplay(value)
      return
    }

    const from = current.current
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / Math.max(1, duration))
      const next = Math.round(from + (value - from) * easeOutCubic(t))
      current.current = next
      setDisplay(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration, disabled, reduced])

  return display
}