import type { ReactNode } from 'react'
import type { IconName } from '../icons/Icon'
import type { StatusTone } from '../display/StatusPill/StatusPill'
import {
  TransactionRow,
  TransactionRowSkeleton,
} from '../display/TransactionRow/TransactionRow'
import { NanaCard } from './NanaCard'

export interface NanaTransactionCardProps {
  title: ReactNode
  amount: number
  currency?: string
  icon?: IconName
  iconTone?: StatusTone
  subtitle?: ReactNode
  negative?: boolean
  status?: ReactNode
  timestamp?: ReactNode
  trailing?: ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function NanaTransactionCard({
  title,
  amount,
  currency,
  icon,
  iconTone,
  subtitle,
  negative,
  status,
  timestamp,
  trailing,
  loading = false,
  onClick,
  className,
}: NanaTransactionCardProps) {
  return (
    <NanaCard
      padding="sm"
      radius="md"
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={className}
    >
      {loading ? (
        <TransactionRowSkeleton />
      ) : (
        <TransactionRow
          icon={icon}
          iconTone={iconTone}
          title={title}
          subtitle={subtitle}
          amount={amount}
          currency={currency}
          negative={negative}
          status={status}
          timestamp={timestamp}
          trailing={trailing}
        />
      )}
    </NanaCard>
  )
}
