import type { ElementType, ReactNode } from 'react'
import { cx } from '../utils/className'
import styles from './typography.module.css'

type TextVariant = 'body' | 'body-lg' | 'body-sm' | 'caption' | 'label' | 'code' | 'monetary'

export interface TextProps {
  as?: ElementType
  variant?: TextVariant
  className?: string
  children?: ReactNode
  align?: 'start' | 'center' | 'end'
  muted?: boolean
}

export function Text({
  as: Tag = 'p',
  variant = 'body',
  className,
  children,
  align,
  muted,
}: TextProps) {
  return (
    <Tag
      className={cx(
        styles.typography,
        styles[`typography--${variant}`],
        align && styles[`typography--align-${align}`],
        muted && styles['typography--muted'],
        className,
      )}
    >
      {children}
    </Tag>
  )
}