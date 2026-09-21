import type { ElementType, ReactNode } from 'react'
import { cx } from '../utils/className'
import styles from './typography.module.css'

type HeadingVariant = 'display' | 'h1' | 'h2' | 'h3'

export interface HeadingProps {
  as?: ElementType
  variant?: HeadingVariant
  id?: string
  className?: string
  children?: ReactNode
}

export function Heading({
  as: Tag = 'div',
  variant = 'h1',
  id,
  className,
  children,
}: HeadingProps) {
  return (
    <Tag id={id} className={cx(styles.typography, styles[`typography--${variant}`], className)}>
      {children}
    </Tag>
  )
}

export type { HeadingVariant }