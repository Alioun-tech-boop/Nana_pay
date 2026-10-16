import { Link } from 'react-router-dom'
import { cx } from '../../../design-system'
import styles from './marketplaceNav.module.css'

export type MarketplaceSection = 'products' | 'shops'

export interface MarketplaceNavProps {
  active: MarketplaceSection
}

/** Bascule entre les deux pages de la marketplace : produits et boutiques. */
export function MarketplaceNav({ active }: MarketplaceNavProps) {
  return (
    <nav className={styles.nav} aria-label="Sections de la marketplace">
      <Link
        to="/marketplace"
        className={cx(styles.link, active === 'products' && styles.linkActive)}
        aria-current={active === 'products' ? 'page' : undefined}
      >
        Produits
      </Link>
      <Link
        to="/boutiques"
        className={cx(styles.link, active === 'shops' && styles.linkActive)}
        aria-current={active === 'shops' ? 'page' : undefined}
      >
        Boutiques
      </Link>
    </nav>
  )
}