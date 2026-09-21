import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './section.module.css'

export interface SectionProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  divider?: boolean
  children?: ReactNode
  className?: string
}

export function Section({
  title,
  description,
  actions,
  size = 'md',
  divider = false,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cx(styles.section, className)}>
      {title || description || actions ? (
        <header className={cx(styles.header, divider && styles['header--divider'])}>
          <div className={styles.heading}>
            {title ? (
              <h2 className={cx(styles.title, styles[`title--${size}`])}>{title}</h2>
            ) : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      {children ? <div className={styles.body}>{children}</div> : null}
    </section>
  )
}