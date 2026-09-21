import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/className'
import { useBodyScrollLock, useFocusTrap } from '../../utils/overlay'
import { Icon } from '../../icons/Icon'
import styles from './bottomSheet.module.css'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnBackdrop = true,
  className,
}: BottomSheetProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(open)
  useFocusTrap(panelRef, open, { onEscape: onClose })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.overlay} onMouseDown={closeOnBackdrop ? onClose : undefined}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(styles.panel, className)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />
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
            aria-label="Fermer"
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