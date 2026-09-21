import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import type { StatusTone } from '../StatusPill/StatusPill'
import { MoneyAmount } from '../../money/MoneyAmount/MoneyAmount'
import { Skeleton } from '../Skeleton/Skeleton'
import styles from './transactionRow.module.css'

export interface TransactionRowProps {
  icon?: IconName
  iconTone?: StatusTone
  title: ReactNode
  subtitle?: ReactNode
  amount: number
  currency?: string
  negative?: boolean
  status?: ReactNode
  timestamp?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}

export function TransactionRow({
  icon = 'receipt',
  iconTone,
  title,
  subtitle,
  amount,
  currency = 'XOF',
  negative = false,
  status,
  timestamp,
  trailing,
  onClick,
  className,
}: TransactionRowProps) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      className={cx(styles.row, onClick && styles.clickable, className)}
      onClick={onClick}
    >
      <span className={cx(styles.icon, iconTone && styles[`icon--${iconTone}`])}>
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </span>
      {timestamp ? <span className={styles.timestamp}>{timestamp}</span> : null}
      <span className={styles.amountCol}>
        <MoneyAmount amount={negative ? -amount : amount} currency={currency} signed className={styles.amount} />
        {status ? <span className={styles.status}>{status}</span> : null}
      </span>
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </Wrapper>
  )
}

export function TransactionRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx(styles.row, className)} aria-hidden="true">
      <Skeleton width={36} height={36} radius="50%" />
      <div className={cx(styles.body, styles.skeletonBody)}>
        <Skeleton width={140} height={14} />
        <Skeleton width={90} height={12} />
      </div>
      <Skeleton width={88} height={14} className={styles.skeletonEnd} />
    </div>
  )
}