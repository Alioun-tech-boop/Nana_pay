import { useId } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import field from '../field.module.css'
import styles from './dateInput.module.css'

export interface DateInputProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
}

export function DateInput({
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder,
  label,
  hint,
  error,
  disabled,
  required,
  id,
  className,
}: DateInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint && !error ? `${inputId}-hint` : undefined

  return (
    <div className={cx(field.field, className)}>
      {label ? (
        <label htmlFor={inputId} className={field.label}>
          {label}
          {required ? <span className={styles.required}> *</span> : null}
        </label>
      ) : null}
      <div className={cx(field.control, field['control--icon'], error && field['control--error'], disabled && styles['control--disabled'])}>
        <span className={field.icon} aria-hidden="true">
          <Icon name="calendar" size={18} />
        </span>
        <input
          id={inputId}
          type="date"
          className={cx(field.input, styles.input)}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => onChange?.(event.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />
      </div>
      {error ? (
        <p id={errorId} className={field.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={field.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}