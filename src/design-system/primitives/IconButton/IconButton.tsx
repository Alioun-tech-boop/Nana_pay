import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import { Spinner } from '../Spinner/Spinner'
import styles from './iconButton.module.css'

export type IconButtonVariant = 'solid' | 'subtle' | 'outline' | 'ghost'
export type IconButtonSize = 'sm' | 'md'

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  label: string
  icon?: IconName
  variant?: IconButtonVariant
  size?: IconButtonSize
  loading?: boolean
}

export function IconButton({
  label,
  icon,
  variant = 'subtle',
  size = 'md',
  loading = false,
  disabled,
  className,
  onClick,
  ...props
}: IconButtonProps) {
  const busy = loading || disabled
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={busy}
      className={cx(styles.iconButton, styles[`iconButton--${variant}`], styles[`iconButton--${size}`], className)}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 18} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} /> : null}
    </button>
  )
}