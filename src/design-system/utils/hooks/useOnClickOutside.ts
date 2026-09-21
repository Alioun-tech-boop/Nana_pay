import { useEffect, useRef } from 'react'

export function useOnClickOutside<T extends HTMLElement>(
  onOutside: (event: MouseEvent | TouchEvent) => void,
  enabled = true,
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return
    function handle(event: MouseEvent | TouchEvent) {
      const el = ref.current
      if (!el) return
      const target = event.target as Node | null
      if (!target || !target.isConnected) return
      if (el.contains(target)) return
      onOutside(event)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [enabled, onOutside])

  return ref
}