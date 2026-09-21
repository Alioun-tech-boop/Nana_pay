import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../utils/className'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/Icon'
import type { ProgressTone } from '../display/ProgressBar/ProgressBar'
import { ProgressBar } from '../display/ProgressBar/ProgressBar'
import { MoneyAmount } from '../money/MoneyAmount/MoneyAmount'
import { Text } from '../typography/Text'
import { NanaCard } from './NanaCard'
import type { NanaCardRadius, NanaCardTone } from './NanaCard'
import styles from './cards.module.css'

export type PhotoMediaRatio = '16 / 11' | '16 / 10' | '4 / 3' | '3 / 2' | '1 / 1' | '4 / 5'

export interface NanaPhotoCardProgress {
  value: number
  max?: number
  tone?: ProgressTone
  label?: string
}

export interface NanaPhotoCardProps {
  /** Photo plein cadre. Si absente, un fond cinématographique est composé. */
  image?: string
  imageAlt?: string
  icon?: IconName
  mediaRatio?: PhotoMediaRatio
  /** Badge posé sur la photo (haut). */
  badge?: ReactNode
  /** Petit label au-dessus du montant, sur la photo. */
  label?: ReactNode
  /** Montant principal posé sur la photo. */
  amount?: number
  currency?: string
  /** Ligne sous le montant (ex. « Comptes »). */
  caption?: ReactNode
  /** Titre de la section sous la photo (ex. « Objectif »). */
  title?: ReactNode
  titleMeta?: ReactNode
  description?: ReactNode
  progress?: NanaPhotoCardProgress
  /** Libellé d'action avec chevron (ex. « Épargne automatique »). */
  actionLabel?: ReactNode
  onAction?: () => void
  /** Contenu personnalisé de pied de carte (remplace `actionLabel`). */
  action?: ReactNode
  /** Crochet visuel de variante (gradient du placeholder). */
  variant?: string
  tone?: NanaCardTone
  radius?: NanaCardRadius
  interactive?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

/**
 * Carte photo NanaPay. La photographie occupe la partie supérieure et
 * se fond dans la surface sombre via un gradient transparent → noir ;
 * tout le texte est rendu par l'interface, jamais incrusté dans l'image.
 */
export function NanaPhotoCard({
  image,
  imageAlt,
  icon = 'camera',
  mediaRatio = '16 / 11',
  badge,
  label,
  amount,
  currency = 'XOF',
  caption,
  title,
  titleMeta,
  description,
  progress,
  actionLabel,
  onAction,
  action,
  variant,
  tone = 'default',
  radius = 'lg',
  interactive = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: NanaPhotoCardProps) {
  const handleClick = onClick ?? onAction
  const isInteractive = interactive || Boolean(handleClick)

  return (
    <NanaCard
      padding="none"
      radius={radius}
      tone={tone}
      interactive={isInteractive}
      disabled={disabled}
      loading={loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cx(styles.photoCard, className)}
      data-variant={variant}
    >
      <div className={styles.photoMedia} style={{ aspectRatio: mediaRatio } as CSSProperties}>
        {image ? (
          <img
            src={image}
            alt={imageAlt ?? ''}
            className={styles.photoImage}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.photoPlaceholder} aria-hidden="true">
            <Icon name={icon} size={34} />
          </span>
        )}
        <span className={styles.photoVignette} aria-hidden="true" />
        <span className={styles.photoScrim} aria-hidden="true" />
        {badge ? <span className={styles.photoBadge}>{badge}</span> : null}
        {label || amount !== undefined || caption ? (
          <div className={styles.photoBody}>
            {label ? (
              <Text variant="label" className={styles.photoLabel}>
                {label}
              </Text>
            ) : null}
            {amount !== undefined ? (
              <MoneyAmount
                amount={amount}
                currency={currency}
                variant="strong"
                className={styles.photoAmount}
              />
            ) : null}
            {caption ? <span className={styles.photoCaption}>{caption}</span> : null}
          </div>
        ) : null}
      </div>

      {title || description || progress ? (
        <div className={styles.photoSection}>
          {title ? (
            <div className={styles.photoSectionHead}>
              <span className={styles.photoSectionTitle}>{title}</span>
              {titleMeta ? <span className={styles.photoSectionMeta}>{titleMeta}</span> : null}
            </div>
          ) : null}
          {progress ? (
            <ProgressBar
              value={progress.value}
              max={progress.max}
              tone={progress.tone ?? 'brand'}
              label={progress.label}
            />
          ) : null}
          {description ? <p className={styles.photoDescription}>{description}</p> : null}
        </div>
      ) : null}

      {action ? (
        <div className={styles.photoFooter}>{action}</div>
      ) : actionLabel ? (
        isInteractive ? (
          <span className={styles.photoAction}>
            <span>{actionLabel}</span>
            <span className={styles.photoActionIcon} aria-hidden="true">
              <Icon name="chevron-right" size={16} />
            </span>
          </span>
        ) : (
          <button type="button" className={styles.photoAction} onClick={onAction}>
            <span>{actionLabel}</span>
            <span className={styles.photoActionIcon} aria-hidden="true">
              <Icon name="chevron-right" size={16} />
            </span>
          </button>
        )
      ) : null}
    </NanaCard>
  )
}
