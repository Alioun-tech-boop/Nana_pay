import type { CSSProperties } from 'react'
import { cx } from '../../utils/className'
import styles from './skeleton.module.css'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
  style?: CSSProperties
}

export function Skeleton({ width, height, radius, className, style }: SkeletonProps) {
  const resolved: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
    ...style,
  }
  return <div className={cx(styles.skeleton, className)} style={resolved} aria-hidden="true" />
}

export interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cx(styles.text, className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ width: i === lines - 1 ? '60%' : '100%', height: 14 }}
        />
      ))}
    </div>
  )
}

export function SkeletonTextHeader({ className }: { className?: string }) {
  return (
    <SkeletonText lines={2} className={className} />
  )
}