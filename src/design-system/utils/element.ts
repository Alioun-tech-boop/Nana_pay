import { cloneElement } from 'react'
import type { ReactElement } from 'react'

export function mergeElementProps<E extends ReactElement>(
  element: E,
  extra: Record<string, unknown>,
): E {
  const base = element.props as Record<string, unknown>
  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    const existing = base[key]
    if (typeof existing === 'function' && typeof value === 'function') {
      merged[key] = (...args: unknown[]) => {
        ;(existing as (...a: unknown[]) => void)(...args)
        ;(value as (...a: unknown[]) => void)(...args)
      }
    } else {
      merged[key] = value
    }
  }
  return cloneElement(element, merged) as E
}