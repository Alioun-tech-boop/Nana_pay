import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Navigation } from '../Navigation/Navigation'
import type { NavigationItem } from '../Navigation/Navigation'
import styles from './sidebar.module.css'

export interface SidebarProps {
  brand?: ReactNode
  items: NavigationItem[]
  activeId?: string
  onSelect: (id: string) => void
  footer?: ReactNode
  className?: string
}

export function Sidebar({
  brand,
  items,
  activeId,
  onSelect,
  footer,
  className,
}: SidebarProps) {
  return (
    <aside className={cx(styles.sidebar, className)} aria-label="Barre latérale">
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <div className={styles.navWrap}>
        <Navigation items={items} activeId={activeId} onSelect={onSelect} />
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </aside>
  )
}