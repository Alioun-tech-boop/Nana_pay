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

  // Filter merchants that have an image
  const merchantsWithImage = merchants.filter((m) => m.image)

  if (merchantsWithImage.length === 0) return null

  return (
    <div className={styles.grid}>
      {merchantsWithImage.slice(0, count ?? merchantsWithImage.length).map((merchant) => (
        <StoreCard
          key={merchant.id}
          name={merchant.name}
          image={merchant.image}
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