import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './avatar.module.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'
export type AvatarTone = 'neutral' | 'brand' | 'gold' | 'success' | 'warning' | 'danger'

export interface AvatarProps {
  name?: string
  src?: string
  initials?: string
  icon?: IconName
  alt?: string
  size?: AvatarSize
  tone?: AvatarTone
  statusDot?: boolean
  className?: string
  children?: ReactNode
}

const ICON_SIZE: Record<AvatarSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
}

export function Avatar({
  name,
  src,
  initials,
  icon,
  alt,
  size = 'md',
  tone = 'neutral',
  statusDot,
  className,
  children,
}: AvatarProps) {
  const derivedInitials =
    name && !src
      ? name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? '')
          .join('')
      : undefined

  const displayInitials = initials ?? derivedInitials

  const content = src ? (
    <img src={src} alt={alt ?? name ?? 'Avatar'} className={styles.image} decoding="async" loading="lazy" />
  ) : icon ? (
    <Icon name={icon} size={ICON_SIZE[size]} aria-hidden="true" />
  ) : displayInitials ? (
    <span className={styles.initials} aria-hidden="true">
      {displayInitials}
    </span>
  ) : (
    <Icon name="user" size={ICON_SIZE[size]} aria-hidden="true" />
  )

  return (
    <span
      className={cx(styles.avatar, styles[`avatar--${size}`], styles[`avatar--${tone}`], className)}
    >
      {content}
      {children}
      {statusDot ? <span className={styles.dot} aria-hidden="true" /> : null}
    </span>
  )
}