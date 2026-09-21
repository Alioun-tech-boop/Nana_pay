import { useEffect, useRef } from 'react'

let scrollLockCount = 0

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    scrollLockCount += 1
    document.body.style.overflow = 'hidden'
    return () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1)
      if (scrollLockCount === 0) document.body.style.overflow = ''
    }
  }, [locked])
}

export function isInteractive(element: HTMLElement): boolean {
  const tag = element.tagName
  const role = element.getAttribute('role')
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'BUTTON' ||
    tag === 'A' ||
    role === 'button' ||
    role === 'menuitem' ||
    role === 'option' ||
    (element.tabIndex >= 0)
  )
}

export function queryFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('*')).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && isInteractive(el) && !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  )
}

export function useEscapeKey(handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        handler()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, handler])
}

export function useFocusTrap(
  ref: { current: HTMLElement | null },
  active: boolean,
  options: { onEscape?: () => void; restoreFocus?: boolean } = {},
) {
  const { onEscape, restoreFocus = true } = options
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const raf = requestAnimationFrame(() => {
      const container = ref.current
      if (!container) return
      const focusables = queryFocusable(container)
      ;(focusables[0] ?? container).focus()
    })

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onEscapeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const focusables = queryFocusable(ref.current)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeElement = document.activeElement
      if (event.shiftKey && (activeElement === first || activeElement === ref.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      if (restoreFocus) previous?.focus()
    }
  }, [active, ref, restoreFocus])
}