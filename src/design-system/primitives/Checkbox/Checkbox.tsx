import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import styles from '../control.module.css'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
}

export function Checkbox({ label, className, id, disabled, ...props }: CheckboxProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  return (
    <div className={cx(styles.option, disabled && styles['option--disabled'], className)}>
      <input
        type="checkbox"
        id={controlId}
        className={styles.checkbox}
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