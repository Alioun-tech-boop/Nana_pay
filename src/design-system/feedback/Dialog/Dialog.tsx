import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import styles from './dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeOnBackdrop?: boolean
  className?: string
}

function isInteractive(element: HTMLElement): boolean {
  const tag = element.tagName
  const role = element.getAttribute('role')
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'BUTTON' ||
    tag === 'A' ||
    role === 'button' ||
    (element.tabIndex >= 0 && element.tabIndex <= 0)
  )
}

function queryFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('*')).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && isInteractive(el),
  )
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      document.body.style.overflow = 'hidden'
      const raf = requestAnimationFrame(() => {
        const focusables = panelRef.current ? queryFocusable(panelRef.current) : []
        ;(focusables[0] as HTMLElement | undefined)?.focus?.() ?? panelRef.current?.focus()
      })
      return () => {
        cancelAnimationFrame(raf)
        document.body.style.overflow = ''
        restoreRef.current?.focus?.()
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = queryFocusable(panelRef.current)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onMouseDown={closeOnBackdrop ? onClose : undefined}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(styles.panel, styles[`panel--${size}`], className)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            {title ? (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fermer la fenêtre"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}