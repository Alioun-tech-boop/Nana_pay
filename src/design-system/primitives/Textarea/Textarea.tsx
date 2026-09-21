import type { TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import { FieldError } from '../Input/Input'
import styles from '../field.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  const describedBy = (() => {
    const ids: string[] = []
    if (error) ids.push(errorId)
    else if (hint) ids.push(hintId)
    return ids.length > 0 ? ids.join(' ') : undefined
  })()

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          styles.control,
          styles['control--textarea'],
          error && styles['control--error'],
        )}
      >
        <textarea
          id={textareaId}
          rows={rows}
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