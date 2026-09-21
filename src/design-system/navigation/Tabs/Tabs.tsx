import { useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './tabs.module.css'

export interface TabItem {
  id: string
  label: ReactNode
  count?: number
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (id: string) => void
  variant?: 'underline' | 'pills' | 'segmented'
  className?: string
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id)
  const listRef = useRef<HTMLDivElement>(null)
  const active = value ?? internal

  const select = (next: string) => {
    setInternal(next)
    onChange?.(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    )
    const enabledIndexes = buttons
      .map((button, index) => ({ button, index }))
      .filter(({ button }) => !button.disabled)
    if (enabledIndexes.length === 0) return
    const currentIndex = enabledIndexes.findIndex(({ button }) =>
      button.getAttribute('aria-selected') === 'true',
    )
    const safeCurrent = currentIndex === -1 ? 0 : currentIndex
    let nextIndex = safeCurrent
    if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = enabledIndexes.length - 1
    else {
      const direction = event.key === 'ArrowRight' ? 1 : -1
      nextIndex = (safeCurrent + direction + enabledIndexes.length) % enabledIndexes.length
    }
    const target = enabledIndexes[nextIndex]
    target?.button.focus()
    target?.button.click()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Onglets"
      onKeyDown={onKeyDown}
      className={cx(styles.tabs, styles[`tabs--${variant}`], className)}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={cx(styles.tab, selected && styles.tabActive, item.disabled && styles.tabDisabled)}
            onClick={() => select(item.id)}
          >
            <span className={styles.tabLabel}>{item.label}</span>
            {item.count !== undefined ? (
              <span className={cx(styles.count, selected && styles.countActive)}>
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}