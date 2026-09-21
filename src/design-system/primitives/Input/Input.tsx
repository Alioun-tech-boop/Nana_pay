import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import styles from '../field.module.css'

export interface FieldErrorProps {
  id: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leadingIcon?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const describedBy = (() => {
    const ids: string[] = []
    if (error) ids.push(errorId)
    else if (hint) ids.push(hintId)
    if (ariaDescribedBy) ids.push(ariaDescribedBy)
    return ids.length > 0 ? ids.join(' ') : undefined
  })()

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          styles.control,
          leadingIcon ? styles['control--icon'] : null,
          error && styles['control--error'],
        )}
      >
        {leadingIcon ? <span className={styles.icon}>{leadingIcon}</span> : null}
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error ? <FieldError id={errorId} message={error} /> : null}
      {hint && !error ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}