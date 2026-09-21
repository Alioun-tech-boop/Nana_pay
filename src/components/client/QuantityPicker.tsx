import { Icon } from '../../design-system'
import styles from './modules/quantity.module.css'

export interface QuantityPickerProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  'aria-label'?: string
}

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  'aria-label': ariaLabel = 'Quantité',
}: QuantityPickerProps) {
  const canDecrease = value > min && !disabled
  const canIncrease = value < max && !disabled

  return (
    <span className={styles.picker} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Diminuer la quantité"
      >
        <Icon name="minus" size={15} />
      </button>
      <output className={styles.value} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Augmenter la quantité"
      >
        <Icon name="plus" size={15} />
      </button>
    </span>
  )
}