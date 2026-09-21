import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Spinner } from '../Spinner/Spinner'
import styles from './button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  leadingIcon,
  trailingIcon,
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const busy = loading || disabled
  return (
    <button
      type="button"
      className={cx(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        fullWidth && styles['button--full'],
        loading && styles['button--loading'],
        className,
      )}
      disabled={busy}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading ? trailingIcon : null}
    </button>
  )
}