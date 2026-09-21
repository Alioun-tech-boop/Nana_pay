import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './orderStatus.module.css'

function mapTone(tone: string): 'success' | 'danger' | 'neutral' {
  if (tone === 'success') return 'success'
  if (tone === 'danger') return 'danger'
  return 'neutral'
}

export interface OrderStatusProps {
  stage: string
  label?: ReactNode
  description?: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  icon?: IconName
  className?: string
}

export function OrderStatus({
  stage,
  label,
  description,
  tone = 'neutral',
  icon = 'clock',
  className,
}: OrderStatusProps) {
  const mappedTone = mapTone(tone)
  return (
    <div className={cx(styles.status, styles[`status--${mappedTone}`], className)}>
      <span className={cx(styles.iconWrap, styles[`iconWrap--${mappedTone}`])}>
        <Icon name={icon} size={18} />
      </span>
      <div className={styles.body}>
        <p className={styles.stage}>{label ?? stage}</p>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </div>
  )
}