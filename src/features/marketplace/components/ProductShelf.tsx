import { useNavigate } from 'react-router-dom'
import { ProductCard, Skeleton } from '../../../design-system'
import type { Product } from '../../../types'
import { resolveMediaUrl } from '../../../lib/media'
import { merchantNameById } from '../lib/visual'
import styles from './shelves.module.css'

export interface ProductShelfProps {
  products: Product[]
  loading?: boolean
  count?: number
  skeletonCount?: number
  onOpen?: (product: Product) => void
}

export function ProductShelf({ products, loading, count, skeletonCount = 8, onOpen }: ProductShelfProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className={styles.gridProducts}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <div key={index} className={styles.skeletonCard} aria-hidden="true">
            <Skeleton width="100%" height={100} radius="var(--np-radius-2)" />
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={16} />
          </div>
        ))}
      </div>
    )
  }

  // Tous les produits sont affichés, y compris sans photo : `ProductCard` sait
  // rendre un visuel de remplacement. Filtrer les produits sans image les
  // rendait invisibles et donc impossibles à acheter, alors que le backend les
  // expose comme disponibles.
  if (products.length === 0) return null

  return (
    <div className={styles.gridProducts}>
      {products.slice(0, count ?? products.length).map((product) => {
        const primaryImage = product.images[0]
        const available = product.stock.available && product.status === 'ACTIVE'
        return (
          <ProductCard
            key={product.id}
            name={product.name}
            merchant={merchantNameById(product.merchantId)}
            description={product.description.slice(0, 80)}
            price={product.price.amount}
            currency={product.price.currency}
            image={resolveMediaUrl(primaryImage?.url)}
            imageWidth={primaryImage?.width}
            imageHeight={primaryImage?.height}
            badge={available ? 'En stock' : 'Rupture'}
            badgeTone={available ? 'success' : 'danger'}
            onClick={() => (onOpen ? onOpen(product) : navigate(`/products/${product.id}`))}
            aria-label={`Voir ${product.name}`}
          />
        )
      })}
    </div>
  )
}