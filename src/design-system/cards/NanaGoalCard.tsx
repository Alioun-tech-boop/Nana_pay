import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'
import { MoneyAmount } from '../money/MoneyAmount/MoneyAmount'
import { ProgressBar } from '../display/ProgressBar/ProgressBar'
import { NanaCard } from './NanaCard'
import type { NanaCardTone } from './NanaCard'
import styles from './cards.module.css'

export interface NanaGoalCardProps {
  label: ReactNode
  saved: number
  target: number
  currency?: string
  deadline?: ReactNode
  tone?: NanaCardTone
  action?: ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Objectif d'épargne. `saved` et `target` proviennent du backend ;
 * le pourcentage n'est qu'une présentation bornée.
 */
export function NanaGoalCard({
  label,
  saved,
  target,
  currency = 'XOF',
  deadline,
  tone = 'savings',
  action,
  loading = false,
  onClick,
  className,
}: NanaGoalCardProps) {
  const percent = target > 0 ? Math.min(100, Math.max(0, (saved / target) * 100)) : 0

  return (
    <NanaCard
      tone={tone}
      interactive={Boolean(onClick)}
      loading={loading}
      onClick={onClick}
      className={className}
    >
      <div className={styles.goal}>
        <div className={styles.goalHeader}>
          <span className={styles.goalLabel}>{label}</span>
          <span className={styles.goalPercent}>{Math.round(percent)} %</span>
        </div>
        <div className={styles.goalAmounts}>
          <span className={styles.goalSaved}>
            <MoneyAmount amount={saved} currency={currency} variant="strong" />
          </span>
          <span className={styles.goalTarget}>
            sur <MoneyAmount amount={target} currency={currency} variant="inline" />
          </span>
        </div>
        <ProgressBar
          value={percent}
          tone="gold"
          label={typeof label === 'string' ? `Progression ${label}` : 'Progression de l’épargne'}
        />
        {deadline || action ? (
          <div className={styles.goalFooter}>
            {deadline ? (
              <span className={styles.goalDeadline}>
                <Icon name="calendar" size={14} aria-hidden="true" />
                {deadline}
              </span>
            ) : (
              <span />
            )}
            {action}
          </div>
        ) : null}
      </div>
    </NanaCard>
  )
}
