import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { useAnimatedNumber } from '../../motion'
import { formatMoney, getMoneyDigits } from '../../utils/format'
import styles from './amount.module.css'

export interface AmountProps {
  value: number
  currency: string
  variant?: 'display' | 'default' | 'inline' | 'strong'
  locale?: string
  noSymbol?: boolean
  signed?: boolean
  animate?: boolean
  className?: string
  'aria-label'?: string
  children?: ReactNode
}

export function Amount({
  value,
  currency,
  variant = 'default',
  locale,
  noSymbol = false,
  signed = false,
  animate = false,
  className,
  'aria-label': ariaLabel,
  children,
}: AmountProps) {
  const displayed = useAnimatedNumber(value, { disabled: !animate })
  const code = currency.toUpperCase()
  const formatter = new Intl.NumberFormat(locale ?? 'fr-FR', {
    style: 'currency',
    currency: code,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: getMoneyDigits(code),
    maximumFractionDigits: getMoneyDigits(code),
  })
  const parts = formatter.formatToParts(displayed)
  let numberText = ''
  let currencyText = ''
  for (const part of parts) {
    if (part.type === 'currency') currencyText += part.value
    else numberText += part.value
  }
  numberText = numberText.trim()
  const displayNumber = signed && value > 0 ? `+ ${numberText}` : numberText
  const formatted = formatMoney(displayed, code, { locale, digits: getMoneyDigits(code) })

  return (
    <span
      className={cx(styles.amount, styles[`amount--${variant}`], className)}
      aria-label={ariaLabel ?? formatted}
    >
      {displayNumber}
      {!noSymbol && currencyText ? (
        <span className={styles.amountCurrency}>{currencyText}</span>
      ) : null}
      {children}
    </span>
  )
}
