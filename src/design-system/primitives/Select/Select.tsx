import type { ReactNode, SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import { FieldError } from '../Input/Input'
import styles from '../field.module.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  leadingIcon?: ReactNode
}

export function Select({
  label,
  hint,
  error,
  leadingIcon,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  const describedBy = (() => {
    const ids: string[] = []
    if (error) ids.push(errorId)
    else if (hint) ids.push(hintId)
    return ids.length > 0 ? ids.join(' ') : undefined
  })()

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          styles.control,
          leadingIcon ? styles['control--icon'] : null,
          styles['control--select'],
          error && styles['control--error'],
        )}
      >
        {leadingIcon ? <span className={styles.icon}>{leadingIcon}</span> : null}
        <select
          id={selectId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {children}
        </select>
        <span className={styles.chevron}>
          <Icon name="chevron-down" size={16} />
        </span>
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