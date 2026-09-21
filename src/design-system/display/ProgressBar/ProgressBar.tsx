import { cx } from '../../utils/className'
import type { StatusTone } from '../StatusPill/StatusPill'
import type { BadgeTone } from '../Badge/Badge'
import styles from './progress.module.css'

export type ProgressTone = BadgeTone | 'neutral' | 'brand' | 'gold' | 'cyan'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  value: number
  max?: number
  tone?: ProgressTone
  size?: ProgressSize
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  size = 'sm',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={cx(styles.root, styles[`root--${size}`], className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cx(styles.track, styles[`track--${tone}`])}>
        <div
          className={cx(styles.fill, styles[`fill--${tone}`])}
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
      {showLabel ? (
        <span className={styles.label}>{Math.round(percent)}%</span>
      ) : null}
    </div>
  )
}

export type { StatusTone, BadgeTone }