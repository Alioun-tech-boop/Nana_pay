import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  MoneyAmount,
  ProgressBar,
  Skeleton,
  StatusPill,
  Tabs,
  Text,
} from '../../../design-system'
import { savingsService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'
const savingsHeroImage = '/assets/savings-hero.jpeg'

export function SavingsIndexPage() {
  const savings = useRequest(() => savingsService.getSavings({ pageSize: 50 }), { deps: [] })
  const [activeFilter, setActiveFilter] = useState('active')

  const items = savings.data?.items ?? []
  const activeItems = items.filter((item) => item.status === 'IN_PROGRESS' || item.status === 'EXTENDED')
  const reachedItems = items.filter((item) => item.status === 'REACHED')
  const visibleItems = activeFilter === 'active' ? activeItems : activeFilter === 'reached' ? reachedItems : items

  return (
    <div className={viewStyles.page}>
      <section
        className={styles.hero}
        style={{ backgroundImage: `url(${savingsHeroImage})` }}
        aria-labelledby="savings-hero-title"
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h2 id="savings-hero-title" className={styles.heroTitle}>Épargne progressive</h2>
          <p className={styles.heroMeta}>Construisez votre épargne pas à pas</p>
        </div>
      </section>
      <PageHeader title="Mes plans d'épargne" />

      {savings.isError ? (
        <ErrorState
          title="Épargnes indisponibles"
          description={toUserMessage(savings.error)}
          onRetry={() => void savings.refresh()}
        />
      ) : savings.isLoading ? (
        <section className={viewStyles.surface}>
          <Skeleton width={200} height={16} />
          <Skeleton width={260} height={16} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon="coins"
          title="Aucune épargne en cours"
          description={
            <Text muted>
              Choisissez un produit, puis sélectionnez l’épargne progressive au moment du financement.
            </Text>
          }
          action={
            <Link to="/marketplace">
              <Button leadingIcon={<Icon name="shop" size={16} />}>Explorer le marketplace</Button>
            </Link>
          }
        />
      ) : (
        <>
          <Tabs
            variant="segmented"
            value={activeFilter}
            onChange={setActiveFilter}
            items={[
              { id: 'active', label: 'En cours', count: activeItems.length },
              { id: 'reached', label: 'Atteinte', count: reachedItems.length },
              { id: 'all', label: 'Tout', count: items.length },
            ]}
            className={styles.savingsFilters}
          />

          {visibleItems.length === 0 ? (
            <div className={styles.savingsFilterEmpty} role="status">
              <Icon name={activeFilter === 'reached' ? 'check-circle' : 'coins'} size={20} />
              <span>
                {activeFilter === 'reached'
                  ? 'Aucune épargne atteinte pour le moment.'
                  : 'Aucune épargne en cours pour le moment.'}
              </span>
            </div>
          ) : (
            <div className={styles.savingsList} role="tabpanel" id={`panel-${activeFilter}`}>
              {visibleItems.map((item) => {
            const status = getStatusDefinition(item.status)
            const remaining = Math.max(0, item.targetAmount.amount - item.savedAmount.amount)
            return (
              <Link key={item.id} to={`/savings/${item.id}`} className={styles.savingsCard}>
                <div>
                  <div className={styles.savingsHead}>
                    <StatusPill tone={status.tone} label={status.label} />
                    <span className={styles.savingsRef}>{item.orderReference}</span>
                  </div>
                  <h2 className={styles.savingsTitle}>Épargne commande {item.orderReference}</h2>
                  <div className={styles.savingsProgress}>
                    <ProgressBar value={item.progressPercent} tone="gold" label="Progression de l’épargne" showLabel />
                  </div>
                  <div className={styles.savingsMeta}>
                    <span>
                      Épargné{' '}
                      <MoneyAmount amount={item.savedAmount.amount} currency={item.savedAmount.currency} variant="strong" />
                    </span>
                    <span>
                      Reste <MoneyAmount amount={remaining} currency={item.targetAmount.currency} />
                    </span>
                    <span>
                      Prochain versement{' '}
                      <MoneyAmount amount={item.nextPaymentDue.amount} currency={item.nextPaymentDue.currency} />
                    </span>
                  </div>
                </div>
                <div className={styles.savingsSide}>
                  <div className={styles.savingsSideHeader}>
                    <span className={styles.savingsSideLabel}>Objectif</span>
                    <span className={styles.savingsSidePercent}>{item.progressPercent} %</span>
                  </div>
                  <span className={styles.savingsAmount}>
                    <MoneyAmount amount={item.targetAmount.amount} currency={item.targetAmount.currency} />
                  </span>
                  <span className={styles.savingsSideCaption}>Montant cible confirmé</span>
                  <div className={styles.savingsSideProgress} aria-hidden="true">
                    <span style={{ width: `${Math.min(Math.max(item.progressPercent, 0), 100)}%` }} />
                  </div>
                  <span className={styles.savingsSideAction}>
                    Voir le détail <Icon name="arrow-right" size={16} />
                  </span>
                </div>
              </Link>
            )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}