import { useId } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import { Spinner } from '../Spinner/Spinner'
import field from '../field.module.css'
import styles from './searchInput.module.css'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  onClear?: () => void
  id?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  hint,
  error,
  disabled,
  loading = false,
  onClear,
  id,
  className,
}: SearchInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint && !error ? `${inputId}-hint` : undefined

  return (
    <div className={cx(field.field, className)}>
      {label ? (
        <label htmlFor={inputId} className={field.label}>
          {label}
        </label>
      ) : null}
      <div className={cx(field.control, field['control--icon'], error && field['control--error'], disabled && styles['control--disabled'])}>
        <span className={field.icon} aria-hidden="true">
          <Icon name="search" size={18} />
        </span>
        <input
          id={inputId}
          type="search"
          className={field.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="searchbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />
        {loading ? (
          <span className={styles.status} aria-hidden="true">
            <Spinner size={16} />
          </span>
        ) : value ? (
          <button
            type="button"
            className={styles.status}
            onClick={() => {
              onChange('')
              onClear?.()
            }}
            aria-label="Effacer la recherche"
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
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