import { cx } from '../utils/className'
import styles from './layout.module.css'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cx(
        styles.divider,
        orientation === 'horizontal' ? styles['divider--horizontal'] : styles['divider--vertical'],
        className,
      )}
    />
  )
}