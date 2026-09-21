import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import styles from './scannerFrame.module.css'

export interface ScannerFrameProps {
  children?: ReactNode
  hint?: ReactNode
  scanning?: boolean
  className?: string
}

export function ScannerFrame({
  children,
  hint,
  scanning = true,
  className,
}: ScannerFrameProps) {
  return (
    <div className={cx(styles.frame, className)}>
      <div className={styles.video}>
        {children}
        <div className={styles.corners} aria-hidden="true">
          <span className={cx(styles.corner, styles.cornerTL)} />
          <span className={cx(styles.corner, styles.cornerTR)} />
          <span className={cx(styles.corner, styles.cornerBL)} />
          <span className={cx(styles.corner, styles.cornerBR)} />
        </div>
        {scanning ? (
          <span className={styles.scanline} aria-hidden="true" />
        ) : (
          <span className={styles.noScan} aria-hidden="true" />
        )}
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}