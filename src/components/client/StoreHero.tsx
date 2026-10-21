import { Badge, Icon, Text } from '../../design-system'
import type { Merchant } from '../../types'
import { StoreEmblem } from './StoreEmblem'
import styles from './modules/storeHero.module.css'

export interface StoreHeroProps {
  merchant: Merchant
}

export function StoreHero({ merchant }: StoreHeroProps) {
  // Le backend réel n'expose aujourd'hui que `id`, `name`, `slug`, `status`,
  // `productCount` et `createdAt` : aucun de ces champs enrichis n'est garanti.
  // On affiche donc uniquement ce qui existe réellement, jamais une valeur
  // inventée (AGENTS.md §58).
  const location = [merchant.commune, merchant.city].filter(Boolean).join(', ')
  const monogram =
    merchant.identity?.monogram ??
    merchant.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')

  return (
    <section className={styles.hero}>
      <div className={styles.identity}>
        {merchant.image ? (
          <img src={merchant.image} alt="" className={styles.image} width={96} height={96} />
        ) : (
          <StoreEmblem
            monogram={monogram}
            accent={merchant.identity?.accent ?? 'brand'}
            size="lg"
          />
        )}
        <div className={styles.meta}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{merchant.name}</h1>
            {merchant.verified ? (
              <Badge tone="success">Boutique vérifiée</Badge>
            ) : (
              <Badge tone="neutral">Non vérifiée</Badge>
            )}
          </div>
          {merchant.category ? <p className={styles.category}>{merchant.category}</p> : null}
          <div className={styles.facts}>
            {location ? (
              <span className={styles.fact}>
                <Icon name="shop" size={15} />
                {location}
              </span>
            ) : null}
            {typeof merchant.rating === 'number' ? (
              <span className={styles.fact}>
                <Icon name="check-circle" size={15} />
                {merchant.rating.toFixed(1)} / 5
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {merchant.description ? (
        <div className={styles.blurb}>
          <Text muted>{merchant.description}</Text>
        </div>
      ) : null}
    </section>
  )
}
