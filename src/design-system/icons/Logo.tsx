import { cx } from '../utils/className'
import styles from './logo.module.css'

export interface LogoMarkProps {
  size?: number
  className?: string
  accent?: 'brand' | 'paper'
}

export function LogoMark({ size = 28, className, accent = 'brand' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cx(styles.mark, accent === 'paper' && styles['mark--paper'], className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="11" width="3" height="10" rx="1.2" className={styles.pin} />
      <rect x="25" y="11" width="3" height="10" rx="1.2" className={styles.pin} />
      <rect x="11" y="4" width="10" height="3" rx="1.2" className={styles.pin} />
      <rect x="11" y="25" width="10" height="3" rx="1.2" className={styles.pin} />
      <rect x="9" y="9" width="14" height="14" rx="5" className={styles['chip-body']} />
      <rect x="13" y="13" width="6" height="6" rx="1.8" className={styles.node} />
    </svg>
  )
}

export interface LogoProps {
  size?: number
  markSize?: number
  className?: string
  variant?: 'horizontal' | 'stacked'
}

export function Logo({ size = 24, markSize, className, variant = 'horizontal' }: LogoProps) {
  return (
    <div
      className={cx(
        styles.logo,
        variant === 'stacked' && styles['logo--stacked'],
        className,
      )}
    >
      <LogoMark size={markSize ?? size} />
      <span className={cx(styles.wordmark, variant === 'stacked' && styles['wordmark--stacked'])}>
        Nano<span className={styles.wordmarkAccent}>Pay</span>
      </span>
    </div>
  )
}