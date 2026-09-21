import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './navigation.module.css'

export interface NavigationItem {
  id: string
  label: ReactNode
  icon?: IconName
  group?: string
  badge?: ReactNode
  disabled?: boolean
}

export interface NavigationProps {
  items: NavigationItem[]
  activeId?: string
  onSelect: (id: string) => void
  className?: string
}

export function Navigation({ items, activeId, onSelect, className }: NavigationProps) {
  return (
    <nav className={cx(styles.nav, className)} aria-label="Navigation principale">
      <ul className={styles.list}>
        {items.map((item, index) => {
          const showGroup = Boolean(item.group) && items[index - 1]?.group !== item.group
          const selected = item.id === activeId
          return (
            <li key={item.id}>
              {showGroup ? <p className={styles.group}>{item.group}</p> : null}
              <button
                type="button"
                disabled={item.disabled}
                className={cx(
                  styles.item,
                  selected && styles.itemActive,
                  item.disabled && styles.itemDisabled,
                )}
                onClick={() => onSelect(item.id)}
                aria-current={selected ? 'page' : undefined}
              >
                {item.icon ? (
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name={item.icon} size={18} />
                  </span>
                ) : null}
                <span className={styles.itemLabel}>{item.label}</span>
                {item.badge ? <span className={styles.itemBadge}>{item.badge}</span> : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}