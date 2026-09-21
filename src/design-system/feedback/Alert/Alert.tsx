import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import type { AlertTone } from '../InlineAlert/InlineAlert'
import styles from './alert.module.css'

const ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert',
  danger: 'alert-circle',
  neutral: 'info',
}

export interface AlertProps {
  tone?: AlertTone
  icon?: IconName
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  onClose?: () => void
  className?: string
}

export function Alert({
  tone = 'info',
  icon,
  title,
  children,
  action,
  onClose,
  className,
}: AlertProps) {
  return (
    <div role="alert" className={cx(styles.alert, styles[`alert--${tone}`], className)}>
      <span className={cx(styles.icon, styles[`icon--${tone}`])} aria-hidden="true">
        <Icon name={icon ?? ICONS[tone]} size={18} />
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
      {action ? <div className={styles.actions}>{action}</div> : null}
      {onClose ? (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer l’alerte">
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  )
}