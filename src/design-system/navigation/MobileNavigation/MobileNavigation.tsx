import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { NavigationItem } from '../Navigation/Navigation'
import styles from './mobileNavigation.module.css'

export interface MobileNavigationProps {
  items: NavigationItem[]
  activeId?: string
  onSelect: (id: string) => void
  className?: string
}

export function MobileNavigation({
  items,
  activeId,
  onSelect,
  className,
}: MobileNavigationProps) {
  return (
    <nav className={cx(styles.bar, className)} aria-label="Navigation mobile">
      {items.map((item) => {
        const selected = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            className={cx(styles.item, selected && styles.itemActive)}
            onClick={() => onSelect(item.id)}
            aria-current={selected ? 'page' : undefined}
          >
            {item.icon ? (
              <span className={styles.icon} aria-hidden="true">
                <Icon name={item.icon} size={20} />
              </span>
            ) : null}
            <span className={styles.label}>{item.label}</span>
            {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
          </button>
        )
      })}
    </nav>
  )
}