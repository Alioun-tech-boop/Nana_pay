import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../../utils/className'
import styles from '../control.module.css'

export interface SwitchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
  id,
  ...props
}: SwitchProps) {
  const autoId = useId()
  const switchId = id ?? autoId
  return (
    <div className={cx(styles.option, className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        data-state={checked ? 'on' : 'off'}
        className={cx(styles.switch, checked && styles['switch--on'])}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span className={styles.thumb} />
      </button>
      {label ? (
        <label htmlFor={switchId} className={styles.optionLabel}>
          {label}
        </label>
      ) : null}
    </div>
  )
}