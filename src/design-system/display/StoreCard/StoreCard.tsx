import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '../../utils/className'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import { Skeleton } from '../Skeleton/Skeleton'
import styles from './storeCard.module.css'

export interface StoreCardProps {
  name: ReactNode
  status?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  onClick?: () => void
  className?: string
}

export function StoreCard({
  name,
  status,
  image,
  imageWidth,
  imageHeight,
  onClick,
  className,
}: StoreCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article
      className={cx(styles.card, onClick && styles.clickable, className)}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
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
          <div className={styles.placeholder} />
        )}
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
      </div>
    </article>
  )
}

export function StoreCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx(styles.card, className)} aria-hidden="true">
      <div className={styles.media}>
        <Skeleton width="100%" height={132} radius="var(--np-radius-2)" />
      </div>
      <div className={styles.body}>
        <Skeleton width={140} height={14} />
      </div>
    </div>
  )
}