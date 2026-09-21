import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { mergeElementProps } from '../../utils/element'
import { useEscapeKey } from '../../utils/overlay'
import { useOnClickOutside } from '../../utils/hooks/useOnClickOutside'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './dropdown.module.css'

export interface DropdownItem {
  label: ReactNode
  icon?: IconName
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
  onSelect?: () => void
}

export interface DropdownProps {
  trigger: ReactElement
  items: DropdownItem[]
  align?: 'start' | 'end'
  label?: string
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Dropdown({
  trigger,
  items,
  align = 'end',
  label,
  onOpenChange,
  className,
}: DropdownProps) {
  const autoId = useId()
  const menuId = `${autoId}-menu`
  const [open, setOpen] = useState(false)
  const containerRef = useOnClickOutside<HTMLDivElement>(() => setOpenState(false), open)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const labelRef = useRef<string | undefined>(label)

  function setOpenState(next: boolean) {
    setOpen(next)
    onOpenChange?.(next)
  }

  function toggle() {
    setOpenState(!open)
  }

  function closeAndReturnFocus() {
    setOpenState(false)
    containerRef.current?.focus()
  }

  useEffect(() => {
    labelRef.current = label
  }, [label])

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => itemRefs.current.find(Boolean)?.focus())
    return () => cancelAnimationFrame(raf)
  }, [open])

  function moveFocus(direction: 1 | -1) {
    const enabled = itemRefs.current.map((ref, index) => ({ ref, index })).filter((entry) => entry.ref)
    if (enabled.length === 0) return
    const current = document.activeElement as HTMLElement | null
    const position = enabled.findIndex((entry) => entry.ref === current)
    const next =
      position === -1
        ? direction === 1
          ? 0
          : enabled.length - 1
        : (position + direction + enabled.length) % enabled.length
    enabled[next].ref?.focus()
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      itemRefs.current.find(Boolean)?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      const last = [...itemRefs.current].reverse().find(Boolean)
      last?.focus()
    }
  }

  useEscapeKey(closeAndReturnFocus, open)

  const triggerNode = mergeElementProps(trigger, {
    onClick: toggle,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': menuId,
  })

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={cx(styles.wrapper, className)}
      onKeyDown={handleMenuKeyDown}
    >
      {triggerNode}
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={labelRef.current}
          className={cx(styles.menu, align === 'start' ? styles['menu--start'] : styles['menu--end'])}
        >
          {items.map((item, index) => (
            <button
              key={index}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              tabIndex={-1}
              className={cx(
                styles.item,
                item.danger && styles['item--danger'],
                item.separatorBefore && styles['item--separator'],
              )}
              onClick={() => {
                if (item.disabled) return
                item.onSelect?.()
                setOpenState(false)
              }}
              onMouseEnter={() => itemRefs.current[index]?.focus()}
            >
              {item.icon ? (
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon name={item.icon} size={16} />
                </span>
              ) : null}
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}