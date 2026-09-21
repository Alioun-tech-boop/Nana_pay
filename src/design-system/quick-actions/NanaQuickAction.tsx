import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils/className'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/Icon'
import { Spinner } from '../primitives/Spinner/Spinner'
import styles from './quickActions.module.css'

export type NanaQuickActionVariant =
  | 'recharge'
  | 'send'
  | 'withdraw'
  | 'pay'
  | 'scan'
  | 'more'

export interface NanaQuickActionPreset {
  icon: IconName
  label: string
}

export const nanaQuickActionPresets: Record<NanaQuickActionVariant, NanaQuickActionPreset> = {
  recharge: { icon: 'plus', label: 'Recharger' },
  send: { icon: 'arrow-up-right', label: 'Acheter' },
  withdraw: { icon: 'download', label: 'Retirer' },
  pay: { icon: 'card', label: 'Payer' },
  scan: { icon: 'scan', label: 'Scanner' },
  more: { icon: 'more', label: 'Plus' },
}

export interface NanaQuickActionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Variante métier : préréglage icône + label (surchargeables). */
  variant: NanaQuickActionVariant
  label?: string
  icon?: IconName
  loading?: boolean
  badge?: ReactNode
}

/**
 * Action rapide NanoPay : cercle elevated + icône + label, aligné au centre.
 * Toute navigation, permission et confirmation restent décidées par l'appelant.
 */
export function NanaQuickAction({
  variant,
  label,
  icon,
  loading = false,
  badge,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...props
}: NanaQuickActionProps) {
  const preset = nanaQuickActionPresets[variant]
  const busy = loading || disabled
  const accessibleLabel = label ?? preset.label

  return (
    <button
      type="button"
      className={cx(styles.quickAction, className)}
      disabled={busy}
      aria-busy={loading || undefined}
      aria-label={ariaLabel ?? accessibleLabel}
      {...props}
    >
      <span className={styles.quickActionCircle}>
        {loading ? <Spinner size={20} /> : <Icon name={icon ?? preset.icon} size={22} />}
        {badge != null ? <span className={styles.quickActionBadge}>{badge}</span> : null}
      </span>
      <span className={styles.quickActionLabel}>{accessibleLabel}</span>
    </button>
  )
}

export interface NanaQuickActionsProps {
  children: ReactNode
  'aria-label'?: string
  className?: string
}

/**
 * Grille responsive d'actions rapides : les actions s'étirent pour remplir la
 * ligne, et débordent en défilement horizontal lorsque l'espace manque.
 */
export function NanaQuickActions({
  children,
  className,
  'aria-label': ariaLabel = 'Actions rapides',
}: NanaQuickActionsProps) {
  return (
    <nav className={cx(styles.quickActions, className)} aria-label={ariaLabel}>
      {children}
    </nav>
  )
}
