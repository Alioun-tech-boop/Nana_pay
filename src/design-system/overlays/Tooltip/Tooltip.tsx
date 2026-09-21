import { useId, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { mergeElementProps } from '../../utils/element'
import styles from './tooltip.module.css'

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipProps {
  content: ReactNode
  children: ReactElement
  side?: TooltipSide
  align?: TooltipAlign
  delay?: number
  disabled?: boolean
  id?: string
  className?: string
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 150,
  disabled,
  id,
  className,
}: TooltipProps) {
  const autoId = useId()
  const tooltipId = id ?? autoId
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  function openNow() {
    window.clearTimeout(timer.current)
    setOpen(true)
  }

  function openDelayed() {
    window.clearTimeout(timer.current)
    if (delay === 0) {
      setOpen(true)
      return
    }
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }

  function close() {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  const child = mergeElementProps(children, {
    'aria-describedby': open && !disabled ? tooltipId : undefined,
    onMouseEnter: openDelayed,
    onMouseLeave: close,
    onFocus: openNow,
    onBlur: close,
  })

  return (
    <span className={cx(styles.wrapper, className)}>
      {child}
      {open && !disabled ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cx(styles.tooltip, styles[`tooltip--${side}`], styles[`tooltip--${align}`])}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}