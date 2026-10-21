import { Icon } from '../../../design-system'
import type { IconName } from '../../../design-system'
import styles from './onboardingBackdrop.module.css'

/**
 * Fond animé de l'écran d'ouverture : cartes bancaires et cartes produit
 * flottant lentement en profondeur. Purement décoratif (`aria-hidden`), sans
 * aucun texte — l'écran ne doit contenir qu'un bouton.
 *
 * Toutes les animations sont coupées via `prefers-reduced-motion` (voir CSS).
 */

interface FloatingCard {
  kind: 'credit' | 'product'
  icon: IconName
  className: string
  delay: string
}

const CARDS: FloatingCard[] = [
  { kind: 'credit', icon: 'card', className: styles.cardA, delay: '0s' },
  { kind: 'product', icon: 'box', className: styles.cardB, delay: '-3s' },
  { kind: 'credit', icon: 'wallet', className: styles.cardC, delay: '-6s' },
  { kind: 'product', icon: 'shop', className: styles.cardD, delay: '-2s' },
  { kind: 'credit', icon: 'coins', className: styles.cardE, delay: '-5s' },
  { kind: 'product', icon: 'vault', className: styles.cardF, delay: '-4s' },
]

export function OnboardingBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.grid} />
      <div className={styles.glowA} />
      <div className={styles.glowB} />
      {CARDS.map((card, index) =>
        card.kind === 'credit' ? (
          <div
            key={index}
            className={`${styles.card} ${styles.credit} ${card.className}`}
            style={{ animationDelay: card.delay }}
          >
            <span className={styles.chip} />
            <span className={styles.cardNumber}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className={styles.cardIcon}>
              <Icon name={card.icon} size={20} />
            </span>
          </div>
        ) : (
          <div
            key={index}
            className={`${styles.card} ${styles.product} ${card.className}`}
            style={{ animationDelay: card.delay }}
          >
            <span className={styles.productImage}>
              <Icon name={card.icon} size={30} />
            </span>
            <span className={styles.productLines}>
              <i />
              <i />
            </span>
          </div>
        ),
      )}
    </div>
  )
}
