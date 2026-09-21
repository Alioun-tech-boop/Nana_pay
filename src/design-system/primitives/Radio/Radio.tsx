import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import styles from '../control.module.css'

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
}

export function Radio({ label, className, id, disabled, ...props }: RadioProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  return (
    <div className={cx(styles.option, disabled && styles['option--disabled'], className)}>
      <input
        type="radio"
        id={controlId}
        className={styles.radio}
        disabled={disabled}
        {...props}
      />
      {label ? (
        <label htmlFor={controlId} className={styles.optionLabel}>
          {label}
        </label>
      ) : null}
    </div>
  )
}

export interface RadioGroupProps {
  label?: ReactNode
  name: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  options: Array<{ value: string; label: ReactNode }>
}

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  disabled,
  className,
  options,
}: RadioGroupProps) {
  return (
    <fieldset className={cx(styles.group, className)}>
      {label ? <legend className={styles.groupLabel}>{label}</legend> : null}
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange?.(option.value)}
          disabled={disabled}
          label={option.label}
        />
      ))}
    </fieldset>
  )
}