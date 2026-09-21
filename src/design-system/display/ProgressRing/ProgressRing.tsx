import { cx } from '../../utils/className'
import type { StatusTone } from '../StatusPill/StatusPill'
import styles from './progressRing.module.css'

export interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  tone?: StatusTone
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  tone = 'success',
  label,
  showValue = false,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const center = size / 2

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ width: size, height: size }}
      className={cx(styles.ring, className)}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={styles.track}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={cx(styles.bar, styles[`bar--${tone}`])}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {showValue ? (
        <span className={cx(styles.value, 'np-number')}>{Math.round(clamped)}%</span>
      ) : null}
    </div>
  )
}