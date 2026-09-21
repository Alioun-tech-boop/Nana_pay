import { useId, useState } from 'react'
import { cx } from '../../utils/className'
import styles from './phoneInput.module.css'

export interface PhoneCode {
  id: string
  code: string
  label: string
}

export interface PhoneInputProps {
  value: string
  onValueChange: (value: string) => void
  codes?: PhoneCode[]
  codeValue?: string
  onCodeChange?: (code: string) => void
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

const DEFAULT_CODES: PhoneCode[] = [
  { id: 'CI', code: '+225', label: 'Côte d’Ivoire (+225)' },
  { id: 'SN', code: '+221', label: 'Sénégal (+221)' },
  { id: 'ML', code: '+223', label: 'Mali (+223)' },
  { id: 'BF', code: '+226', label: 'Burkina Faso (+226)' },
  { id: 'TG', code: '+228', label: 'Togo (+228)' },
  { id: 'BJ', code: '+229', label: 'Bénin (+229)' },
  { id: 'GN', code: '+224', label: 'Guinée (+224)' },
  { id: 'CM', code: '+237', label: 'Cameroun (+237)' },
  { id: 'FR', code: '+33', label: 'France (+33)' },
]

export function PhoneInput({
  value,
  onValueChange,
  codes = DEFAULT_CODES,
  codeValue,
  onCodeChange,
  label,
  hint,
  error,
  placeholder = '07 00 00 00 00',
  disabled,
  id,
  className,
}: PhoneInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [internalCode, setInternalCode] = useState(codes[0]?.id ?? '')
  const activeCode = codeValue ?? internalCode
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint && !error ? `${inputId}-hint` : undefined

  function handleCodeChange(next: string) {
    if (onCodeChange) {
      onCodeChange(next)
    } else {
      setInternalCode(next)
    }
  }

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div className={cx(styles.control, error && styles['control--error'], disabled && styles['control--disabled'])}>
        <div className={styles.prefix}>
          <label className={styles.prefixLabel} htmlFor={`${inputId}-code`}>
            <span className={styles.srOnly}>Indicatif téléphonique</span>
          </label>
          <select
            id={`${inputId}-code`}
            className={styles.select}
            value={activeCode}
            onChange={(event) => handleCodeChange(event.target.value)}
            disabled={disabled}
            aria-label="Indicatif téléphonique"
          >
            {codes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.code}
              </option>
            ))}
          </select>
          <span className={styles.code} aria-hidden="true">
            {codes.find((code) => code.id === activeCode)?.code ?? ''}
          </span>
        </div>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className={styles.input}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}