import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../utils/className'
import styles from './layout.module.css'

export type SpaceScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

function spaceVar(gap: SpaceScale | string): string {
  if (typeof gap === 'number') return `var(--np-space-${gap})`
  return gap
}

export interface StackProps {
  gap?: SpaceScale | string
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Stack({ gap = 4, align, justify, className, style, children }: StackProps) {
  return (
    <div
      className={cx(
        styles.stack,
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        className,
      )}
      style={{ gap: spaceVar(gap), ...style }}
    >
      {children}
    </div>
  )
}

export interface InlineProps {
  gap?: SpaceScale | string
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Inline({
  gap = 3,
  align = 'center',
  justify,
  wrap = true,
  className,
  style,
  children,
}: InlineProps) {
  return (
    <div
      className={cx(
        styles.inline,
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        wrap && styles['wrap'],
        className,
      )}
      style={{ gap: spaceVar(gap), ...style }}
    >
      {children}
    </div>
  )
}