import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './topbar.module.css'

export interface TopbarProps {
  leading?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  menuButton?: ReactNode
  className?: string
}

export function Topbar({
  leading,
  title,
  subtitle,
  actions,
  menuButton,
  className,
}: TopbarProps) {
  return (
    <header className={cx(styles.topbar, className)}>
      {menuButton ? <div className={styles.menuButton}>{menuButton}</div> : null}
      {leading ? <div className={styles.leading}>{leading}</div> : null}
      <div className={styles.titleBlock}>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}