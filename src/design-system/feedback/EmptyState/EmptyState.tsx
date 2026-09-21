import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './empty.module.css'

export interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon = 'box',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      <span className={styles.icon}>
        <Icon name={icon} size={28} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  description?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = "Cette page n'a pas pu être chargée",
  description,
  onRetry,
  retryLabel = 'Réessayer',
  className,
}: ErrorStateProps) {
  return (
    <div className={cx(styles.empty, styles['empty--error'], className)}>
      <span className={styles.icon}>
        <Icon name="alert-circle" size={28} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {onRetry ? (
        <div className={styles.action}>
          <button type="button" className={styles.retry} onClick={onRetry}>
            <Icon name="refresh" size={16} />
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}