import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Button,
  Icon,
  Section,
} from '../../../design-system'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'
const paymentHeroImage = '/assets/payment-hero.jpeg'

export function PaymentModePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<'MOBILE_MONEY' | 'BANK_CARD'>('MOBILE_MONEY')

  return (
    <div className={`${viewStyles.page} ${styles.paymentModePage}`}>
      <PageHeader title="Choisir un mode de paiement" />

      <section
        className={styles.hero}
        style={{ backgroundImage: `url(${paymentHeroImage})` }}
        aria-labelledby="payment-hero-title"
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h2 id="payment-hero-title" className={styles.heroTitle}>Choisir un mode de paiement</h2>
          <p className={styles.heroMeta}>Sélectionnez votre méthode de paiement préférée</p>
        </div>
      </section>

      <Section title="Modes de paiement disponibles">
        <div className={styles.paymentMethodsGrid}>
          <article className={`${styles.paymentMethodCard} ${selectedMethod === 'MOBILE_MONEY' ? styles.selected : ''}`} onClick={() => setSelectedMethod('MOBILE_MONEY')}>
            <div className={styles.paymentMethodIcon}>
              <Icon name="money" size={28} />
            </div>
            <h3 className={styles.paymentMethodTitle}>Mobile Money</h3>
            <p className={styles.paymentMethodDescription}>
              Orange Money, Moov Money, Wave
            </p>
            <p className={styles.paymentMethodDetail}>
              Paiement instantané via votre opérateur mobile
            </p>
            <span className={`${styles.paymentMethodBadge} ${selectedMethod === 'MOBILE_MONEY' ? styles.selected : ''}`}>
              {selectedMethod === 'MOBILE_MONEY' ? 'Sélectionné' : 'Choisir'}
            </span>
          </article>

          <article className={`${styles.paymentMethodCard} ${selectedMethod === 'BANK_CARD' ? styles.selected : ''}`} onClick={() => setSelectedMethod('BANK_CARD')}>
            <div className={styles.paymentMethodIcon}>
              <Icon name="card" size={28} />
            </div>
            <h3 className={styles.paymentMethodTitle}>Carte Bancaire</h3>
            <p className={styles.paymentMethodDescription}>
              Visa, Mastercard, CB
            </p>
            <p className={styles.paymentMethodDetail}>
              Paiement sécurisé par carte bancaire
            </p>
            <span className={`${styles.paymentMethodBadge} ${selectedMethod === 'BANK_CARD' ? styles.selected : ''}`}>
              {selectedMethod === 'BANK_CARD' ? 'Sélectionné' : 'Choisir'}
            </span>
          </article>
        </div>
      </Section>

      <Section title="Continuer">
        <div className={styles.continueActions}>
          <Button className={styles.continueButton} size="lg" fullWidth onClick={() => {
            // Navigate to the appropriate payment flow based on selected method
            if (selectedMethod === 'MOBILE_MONEY') {
              navigate(`/payments/mobile-money${location.search}`)
            } else {
              navigate(`/payments/bank-card${location.search}`)
            }
          }}>
            Continuer avec {selectedMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Carte Bancaire'}
          </Button>
        </div>
      </Section>
    </div>
  )
}