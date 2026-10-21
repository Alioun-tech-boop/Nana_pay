import { useNavigate } from 'react-router-dom'
import { StoreCard, StoreCardSkeleton } from '../../../design-system'
import type { Merchant } from '../../../types'
import { Icon } from '../../../design-system'
import styles from './shelves.module.css'

export interface MerchantShelfProps {
  merchants: Merchant[]
  loading?: boolean
  count?: number
  skeletonCount?: number
  onOpen?: (merchant: Merchant) => void
}

export function MerchantShelf({ merchants, loading, count, skeletonCount = 6, onOpen }: MerchantShelfProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <StoreCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  // Le backend n'expose pas (encore) d'image de boutique : filtrer sur `image`
  // rendait TOUTES les boutiques invisibles. On affiche donc chaque boutique et
  // `StoreCard` rend son visuel de remplacement quand il n'y a pas d'image.
  if (merchants.length === 0) return null

  return (
    <div className={styles.grid}>
      {merchants.slice(0, count ?? merchants.length).map((merchant) => (
        <StoreCard
          key={merchant.id}
          name={merchant.name}
          image={merchant.image || undefined}
          imageWidth={300}
          imageHeight={225}
          onClick={() => (onOpen ? onOpen(merchant) : navigate(`/shops/${merchant.id}`))}
        />
      ))}
    </div>
  )
}

export function StoreLink({ merchant }: { merchant: Merchant | undefined }) {
  if (!merchant) return null
  return (
    <a className={styles.storeLink} href={`/shops/${merchant.id}`}>
      <Icon name="shop" size={15} />
      {merchant.name}
    </a>
  )
}