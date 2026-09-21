import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './inlineAlert.module.css'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert',
  danger: 'alert-circle',
  neutral: 'info',
}

export interface InlineAlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function InlineAlert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: InlineAlertProps) {
  return (
    <div
      role="alert"
      className={cx(styles.alert, styles[`alert--${tone}`], className)}
    >
      <span className={cx(styles.icon, styles[`icon--${tone}`])} aria-hidden="true">
        <Icon name={ICONS[tone]} size={18} />
      </span>
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}