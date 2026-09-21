import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import { MoneyAmount } from '../../money/MoneyAmount/MoneyAmount'
import styles from './productCard.module.css'

export interface ProductCardProps {
  name: ReactNode
  price?: number
  priceNote?: ReactNode
  currency?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  icon?: IconName
  badge?: ReactNode
  badgeTone?: 'success' | 'danger'
  merchant?: ReactNode
  description?: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

export function ProductCard({
  name,
  price,
  priceNote,
  currency = 'XOF',
  image,
  imageWidth,
  imageHeight,
  icon = 'box',
  badge,
  badgeTone = 'success',
  merchant,
  description,
  active = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: ProductCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article
      className={cx(styles.card, active && styles.selected, onClick && styles.clickable, className)}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel ?? (typeof name === 'string' ? name : undefined)}
    >
      <div className={styles.media}>
        {image ? (
          <img
            src={image}
            alt=""
            className={styles.image}
            loading="lazy"
            decoding="async"
            width={imageWidth}
            height={imageHeight}
          />
        ) : (
          <span className={styles.placeholder}>
            <Icon name={icon} size={28} />
          </span>
        )}
        {badge ? <span className={`${styles.badge} ${styles[`badge--${badgeTone}`]}`}>{badge}</span> : null}
        {active ? (
          <span className={styles.check} aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
        ) : null}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        {merchant ? <p className={styles.merchant}>{merchant}</p> : null}
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.priceRow}>
          {price !== undefined ? (
            <span className={styles.price}>
              <MoneyAmount amount={price} currency={currency} />
            </span>
          ) : null}
          {priceNote ? <span className={styles.priceNote}>{priceNote}</span> : null}
        </div>
      </div>
    </article>
  )
}