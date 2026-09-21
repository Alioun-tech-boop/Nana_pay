import type { ReactNode } from 'react'
import { cx } from '../utils/className'
import { LogoMark } from '../icons/Logo'
import { MoneyAmount } from '../money/MoneyAmount/MoneyAmount'
import { NanaCard } from './NanaCard'
import styles from './cards.module.css'

export interface NanaAccountCardProps {
  label: ReactNode
  amount: number
  currency?: string
  number?: ReactNode
  holder?: ReactNode
  badge?: ReactNode
  footer?: ReactNode
  interactive?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

/**
 * Carte compte / porte-monnaie (Épargne, Coffre NanoPay, Crédit).
 * Le solde affiché provient toujours du backend.
 */
export function NanaAccountCard({
  label,
  amount,
  currency = 'XOF',
  number,
  holder,
  badge,
  footer,
  interactive = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: NanaAccountCardProps) {
  const isInteractive = interactive || Boolean(onClick)

  return (
    <NanaCard
      padding="lg"
      radius="xl"
      interactive={isInteractive}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cx(styles.account, className)}
    >
      <div className={styles.accountTop}>
        <span className={styles.accountHeading}>
          <span className={styles.accountLabel}>{label}</span>
          {number ? <span className={styles.accountNumber}>{number}</span> : null}
        </span>
        <span className={styles.accountMark} aria-hidden="true">
          <LogoMark size={20} />
        </span>
      </div>
      <div className={styles.accountBalance}>
        <MoneyAmount amount={amount} currency={currency} variant="display" />
      </div>
      {holder || badge || footer ? (
        <div className={styles.accountFooter}>
          <span className={styles.accountMeta}>
            {holder ? <span>{holder}</span> : null}
            {badge}
          </span>
          {footer}
        </div>
      ) : null}
    </NanaCard>
  )
}
