import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import type { StatusTone } from '../StatusPill/StatusPill'
import styles from './statusBadge.module.css'

const GREEN = '#10B981'

const DEFAULT_TONES: Record<string, StatusTone | 'verified'> = {
  // Success states (green)
  active: 'success',
  approved: 'success',
  confirmed: 'success',
  completed: 'success',
  delivered: 'success',
  done: 'success',
  enabled: 'success',
  paid: 'success',
  success: 'success',
  reached: 'success',
  verified: 'verified',
  // Neutral/pending states
  pending: 'neutral',
  in_progress: 'neutral',
  processing: 'neutral',
  generated: 'neutral',
  scanned: 'neutral',
  info: 'neutral',
  partial: 'neutral',
  suspended: 'neutral',
  waiting: 'neutral',
  in_review: 'neutral',
  // Danger states (red)
  cancelled: 'danger',
  canceled: 'danger',
  expired: 'danger',
  failed: 'danger',
  refused: 'danger',
  rejected: 'danger',
  danger: 'danger',
  defaulted: 'danger',
  out_of_stock: 'danger',
  refunded: 'danger',
  // Neutral fallback
  neutral: 'neutral',
}

export interface StatusBadgeProps {
  status: string
  label?: ReactNode
  tone?: StatusTone
  tones?: Partial<Record<string, StatusTone>>
  icon?: IconName
  pulse?: boolean
  className?: string
}

export function StatusBadge({
  status,
  label,
  tone: toneProp,
  tones,
  icon,
  pulse = false,
  className,
}: StatusBadgeProps) {
  const key = status.toLowerCase()
  const tone = toneProp ?? tones?.[key] ?? DEFAULT_TONES[key] ?? 'neutral'
  const text = label ?? status

  const isVerified = tone === 'verified'

  return (
    <span
      className={cx(styles.badge, tone && styles[`badge--${tone}`], className)}
      style={isVerified ? { background: GREEN, borderColor: GREEN, color: '#0A0A0A' } : undefined}
    >
      <span
        className={cx(styles.dot, tone && styles[`dot--${tone}`], pulse && styles['dot--pulse'])}
        aria-hidden="true"
        style={isVerified ? { background: GREEN } : undefined}
      />
      {icon ? (
        <span className={cx(styles.icon, tone && styles[`icon--${tone}`])} aria-hidden="true" style={isVerified ? { color: '#0A0A0A' } : undefined}>
          <Icon name={icon} size={12} />
        </span>
      ) : null}
      <span className={styles.label}>{text}</span>
    </span>
  )
}