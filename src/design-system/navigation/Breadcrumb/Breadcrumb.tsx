import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import styles from './breadcrumb.module.css'

export interface BreadcrumbItem {
  label: ReactNode
  href?: string
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d’Ariane" className={cx(styles.breadcrumb, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className={styles.item}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">
                  <Icon name="chevron-right" size={14} />
                </span>
              ) : null}
              {item.href && !isLast ? (
                <a href={item.href} className={styles.link}>
                  {item.label}
                </a>
              ) : (
                <span
                  className={styles.text}
                  aria-current={item.current || isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}