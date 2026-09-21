import { Amount } from '../Amount/Amount'
import type { AmountProps } from '../Amount/Amount'

export interface MoneyAmountProps {
  amount: number
  currency?: string
  variant?: AmountProps['variant']
  locale?: string
  noSymbol?: boolean
  signed?: boolean
  animate?: boolean
  className?: string
  'aria-label'?: string
}

export function MoneyAmount({
  amount,
  currency = 'XOF',
  variant = 'default',
  locale,
  noSymbol = false,
  signed = false,
  animate = false,
  className,
  'aria-label': ariaLabel,
}: MoneyAmountProps) {
  return (
    <Amount
      value={amount}
      currency={currency}
      variant={variant}
      locale={locale}
      noSymbol={noSymbol}
      signed={signed}
      animate={animate}
      className={className}
      aria-label={ariaLabel}
    />
  )
}