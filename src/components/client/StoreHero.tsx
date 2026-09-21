import { Badge, Icon, Text } from '../../design-system'
import type { Merchant } from '../../types'
import { StoreEmblem } from './StoreEmblem'
import styles from './modules/storeHero.module.css'

export interface StoreHeroProps {
  merchant: Merchant
}

export function StoreHero({ merchant }: StoreHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.identity}>
        {merchant.image ? (
          <img src={merchant.image} alt="" className={styles.image} width={96} height={96} />
        ) : (
          <StoreEmblem monogram={merchant.identity.monogram} accent={merchant.identity.accent} size="lg" />
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
          <p className={styles.category}>{merchant.category}</p>
          <div className={styles.facts}>
            <span className={styles.fact}>
              <Icon name="shop" size={15} />
              {merchant.commune}, {merchant.city}
            </span>
            <span className={styles.fact}>
              <Icon name="check-circle" size={15} />
              {merchant.rating.toFixed(1)} / 5
            </span>
          </div>
        </div>
      </div>
      <div className={styles.blurb}>
        <Text muted>{merchant.description}</Text>
      </div>
    </section>
  )
}