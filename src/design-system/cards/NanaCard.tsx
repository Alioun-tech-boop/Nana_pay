import type { ReactNode } from 'react'
import { cx } from '../utils/className'
import { Spinner } from '../primitives/Spinner/Spinner'
import styles from './cards.module.css'

export type NanaCardTone =
  | 'default'
  | 'savings'
  | 'vault'
  | 'credit'
  | 'payment'
  | 'confirmation'
  | 'danger'

export type NanaCardPadding = 'none' | 'sm' | 'md' | 'lg'
export type NanaCardRadius = 'md' | 'lg' | 'xl'
export type NanaCardElevation = 'flat' | 'elevated'

export interface NanaCardProps {
  children?: ReactNode
  padding?: NanaCardPadding
  radius?: NanaCardRadius
  tone?: NanaCardTone
  elevation?: NanaCardElevation
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
  onClick?: () => void
  className?: string
  'aria-label'?: string
  'data-variant'?: string
}

/**
 * Fondation unique de toutes les cartes NanoPay.
 * Les variantes (elevated, interactive, photo, compte, statistique,
 * transaction, sécurité, objectif) composent cette surface.
 */
export function NanaCard({
  children,
  padding = 'md',
  radius = 'lg',
  tone = 'default',
  elevation = 'flat',
  interactive = false,
  selected = false,
  disabled = false,
  loading = false,
  loadingLabel = 'Chargement',
  onClick,
  className,
  'aria-label': ariaLabel,
  'data-variant': dataVariant,
}: NanaCardProps) {
  const classes = cx(
    styles.surface,
    styles[`surface--padding-${padding}`],
    styles[`surface--radius-${radius}`],
    styles[`surface--${elevation}`],
    tone !== 'default' && styles[`surface--tone-${tone}`],
    interactive && styles['surface--interactive'],
    selected && styles['surface--selected'],
    disabled && styles['surface--disabled'],
    loading && styles['surface--loading'],
    className,
  )

  const content = (
    <>
      {children}
      {loading ? (
        <span className={styles.loadingLayer} role="status" aria-label={loadingLabel}>
          <Spinner size={22} />
        </span>
      ) : null}
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        className={classes}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={selected || undefined}
        aria-busy={loading || undefined}
        data-variant={dataVariant}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={classes}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      data-variant={dataVariant}
    >
      {content}
    </div>
  )
}

export function NanaCardElevated(props: Omit<NanaCardProps, 'elevation'>) {
  return <NanaCard {...props} elevation="elevated" />
}

export function NanaCardInteractive(props: Omit<NanaCardProps, 'interactive'>) {
  return <NanaCard {...props} interactive />
}
