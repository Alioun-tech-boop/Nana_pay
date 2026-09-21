import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './badge.module.css'

// Accept old tones but map them to new system
type LegacyBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
type BadgeTone = 'success' | 'danger' | 'neutral'

function mapTone(tone: LegacyBadgeTone): BadgeTone {
  if (tone === 'success') return 'success'
  if (tone === 'danger') return 'danger'
  return 'neutral' // info, warning, neutral all map to neutral
}

export type { BadgeTone }

export interface BadgeProps {
  tone?: LegacyBadgeTone
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  const mappedTone = mapTone(tone)
  return (
    <span className={cx(styles.badge, styles[`badge--${mappedTone}`], className)}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children}
    </span>
  )
}