import type { ReactNode } from 'react'
import { NanaCard } from '../../cards/NanaCard'
import type { NanaCardPadding } from '../../cards/NanaCard'

export type CardPadding = NanaCardPadding

export interface CardProps {
  children?: ReactNode
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  padding?: CardPadding
  className?: string
  ariaLabel?: string
}

/**
 * Alias historique de `NanaCard` : conserve l'API d'origine (padding,
 * interactive, selected, disabled) tout en partageant la même fondation
 * visuelle que le système de cartes premium.
 */
export function Card({
  children,
  interactive = false,
  selected = false,
  disabled = false,
  onClick,
  padding = 'md',
  className,
  ariaLabel,
}: CardProps) {
  return (
    <NanaCard
      padding={padding}
      interactive={interactive || Boolean(onClick)}
      selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </NanaCard>
  )
}
