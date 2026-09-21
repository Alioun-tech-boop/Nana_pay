import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './statusPill.module.css'

type LegacyBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
type InternalBadgeTone = 'success' | 'danger' | 'neutral'

function mapTone(tone: LegacyBadgeTone): InternalBadgeTone {
  if (tone === 'success') return 'success'
  if (tone === 'danger') return 'danger'
  return 'neutral'
}

export type StatusTone = InternalBadgeTone

export interface StatusPillProps {
  tone: LegacyBadgeTone
  label: ReactNode
  pulse?: boolean
  className?: string
}

export function StatusPill({ tone, label, pulse = false, className }: StatusPillProps) {
  const mappedTone = mapTone(tone)
  return (
    <span className={cx(styles.pill, styles[`pill--${mappedTone}`], className)}>
      <span
        className={cx(styles.dot, styles[`dot--${mappedTone}`], pulse && styles['dot--pulse'])}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}