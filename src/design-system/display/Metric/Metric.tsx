import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import { Skeleton } from '../Skeleton/Skeleton'
import styles from './metric.module.css'

export interface MetricProps {
  label: string
  value?: ReactNode
  delta?: number
  hint?: ReactNode
  icon?: IconName
  loading?: boolean
  className?: string
}

export function Metric({
  label,
  value,
  delta,
  hint,
  icon,
  loading = false,
  className,
}: MetricProps) {
  const trend = delta === undefined || delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down'

  return (
    <div className={cx(styles.metric, className)}>
      <div className={styles.header}>
        <p className={styles.label}>{label}</p>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton width={120} height={30} />
      ) : (
        <p className={cx(styles.value, 'np-number')}>{value}</p>
      )}
      {delta !== undefined && !loading ? (
        <p className={cx(styles.delta, styles[`delta--${trend}`])} aria-label={`${delta > 0 ? 'En hausse' : delta < 0 ? 'En baisse' : 'Stable'} de ${Math.abs(delta)} %`}>
          <span aria-hidden="true">
            <Icon name={trend === 'up' ? 'arrow-up-right' : trend === 'down' ? 'arrow-right' : 'minus'} size={12} />
          </span>
          {trend === 'neutral' ? 'Stable' : `${Math.abs(delta)} %`}
        </p>
      ) : hint ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  )
}