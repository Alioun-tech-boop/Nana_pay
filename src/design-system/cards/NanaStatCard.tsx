import type { ReactNode } from 'react'
import type { IconName } from '../icons/Icon'
import { Metric } from '../display/Metric/Metric'
import { NanaCard } from './NanaCard'
import type { NanaCardTone } from './NanaCard'

export interface NanaStatCardProps {
  label: string
  value?: ReactNode
  delta?: number
  hint?: ReactNode
  icon?: IconName
  tone?: NanaCardTone
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function NanaStatCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = 'default',
  loading = false,
  onClick,
  className,
}: NanaStatCardProps) {
  return (
    <NanaCard
      tone={tone}
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={className}
    >
      <Metric label={label} value={value} delta={delta} hint={hint} icon={icon} loading={loading} />
    </NanaCard>
  )
}
