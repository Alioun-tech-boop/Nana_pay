import { useId, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { mergeElementProps } from '../../utils/element'
import { useEscapeKey } from '../../utils/overlay'
import { useOnClickOutside } from '../../utils/hooks/useOnClickOutside'
import styles from './popover.module.css'

export type PopoverAlign = 'start' | 'center' | 'end'

export interface PopoverProps {
  trigger: ReactElement
  children: ReactNode
  align?: PopoverAlign
  label: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Popover({
  trigger,
  children,
  align = 'start',
  label,
  open: openProp,
  onOpenChange,
  className,
}: PopoverProps) {
  const autoId = useId()
  const contentId = `${autoId}-content`
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const containerRef = useOnClickOutside<HTMLDivElement>(() => setOpenState(false), open)

  function setOpenState(next: boolean) {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  function toggle() {
    setOpenState(!open)
  }

  function close() {
    setOpenState(false)
  }

  useEscapeKey(close, open)

  const triggerNode = mergeElementProps(trigger, {
    onClick: toggle,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': contentId,
  })

  return (
    <div className={cx(styles.wrapper, className)} ref={containerRef}>
      {triggerNode}
      {open ? (
        <div
          id={contentId}
          role="dialog"
          aria-label={label}
          className={cx(styles.content, styles[`content--${align}`])}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}