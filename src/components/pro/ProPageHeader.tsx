import type { ReactNode } from 'react'
import styles from './pro.module.css'

export interface ProPageHeaderProps {
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}

export function ProPageHeader({ title, meta, actions }: ProPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </header>
  )
}
