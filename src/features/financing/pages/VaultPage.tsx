import { Link } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Icon,
  InlineAlert,
  Metric,
  MoneyAmount,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { vaultService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'
const vaultHeroImage = '/assets/vault-hero.jpeg'

export function VaultPage() {
  const vault = useRequest(() => vaultService.getVault(), { deps: [] })
  const transactions = useRequest(() => vaultService.getTransactions({ pageSize: 25 }), { deps: [] })

  if (vault.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader title="Coffre NanoPay" />
        <ErrorState
          title="Coffre indisponible"
          description={toUserMessage(vault.error)}
          onRetry={() => void vault.refresh()}
        />
      </div>
    )
  }

  const data = vault.data

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Coffre NanoPay" />

      {vault.isLoading || !data ? (
        <section className={viewStyles.surface}>
          <Skeleton width={160} height={20} />
          <Skeleton width={280} height={16} />
        </section>
      ) : (
        <>
          <section
            className={styles.hero}
            style={{ backgroundImage: `url(${vaultHeroImage})` }}
            aria-labelledby="vault-hero-title"
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <span className={`${styles.heroIcon} ${styles['heroIcon--cyan']}`} aria-hidden="true">
                <Icon name="vault" size={26} />
              </span>
              <div>
                <div className={styles.heroMeta}>
                  <StatusPill
                    tone={data.eligible ? 'success' : 'warning'}
                    label={data.eligible ? 'Coffre actif' : 'Non éligible'}
                  />
                  <span className={styles.heroReference}>{data.id}</span>
                </div>
                <h2 id="vault-hero-title" className={styles.heroTitle}>
                  <MoneyAmount amount={data.balance.amount} currency={data.balance.currency} variant="display" animate />
                </h2>
                <p className={styles.heroMeta}>Solde disponible du coffre</p>
                <div className={styles.heroActions}>
                  <Link to="/marketplace">
                    <Button leadingIcon={<Icon name="shop" size={16} />}>Financer une commande</Button>
                  </Link>
                  <Link to="/purchases">
                    <Button variant="secondary">Mes achats</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {!data.eligible ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="warning" title="Coffre non éligible">
                <Text muted>
                  L’usage du coffre est soumis à la validation de votre profil bancaire par votre employeur. Contactez
                  votre employeur ou votre banque pour activer le coffre.
                </Text>
              </InlineAlert>
            </div>
          ) : null}

          <div className={styles.metricGrid}>
            <Metric
              label="Solde du coffre"
              icon="vault"
              value={<MoneyAmount amount={data.balance.amount} currency={data.balance.currency} />}
            />
            <Metric
              label="Contribution mensuelle"
              icon="calendar"
              value={
                data.monthlyContribution ? (
                  <MoneyAmount amount={data.monthlyContribution.amount} currency={data.monthlyContribution.currency} />
                ) : (
                  '—'
                )
              }
            />
            <Metric label="Mouvements" icon="refresh" value={data.transactionsCount} />
          </div>

          <Section title="Mouvements du coffre">
            {transactions.isLoading ? (
              <section className={viewStyles.surface}>
                <Skeleton width={220} height={16} />
                <Skeleton width={260} height={16} />
              </section>
            ) : (transactions.data?.items.length ?? 0) === 0 ? (
              <Text muted>Aucun mouvement pour le moment.</Text>
            ) : (
              <div className={styles.list}>
                {transactions.data?.items.map((entry) => {
                  const credit = entry.direction === 'CREDIT'
                  return (
                    <div key={entry.id} className={styles.item}>
                      <span className={styles.itemIcon} aria-hidden="true">
                        <Icon name={credit ? 'download' : 'upload'} size={18} />
                      </span>
                      <span className={styles.itemMain}>
                        <span className={styles.itemTitle}>
                          {credit ? 'Alimentation du coffre' : 'Financement de commande'}
                        </span>
                        <span className={styles.itemMuted}>
                          {formatDate(entry.createdAt)}
                          {entry.orderReference ? ` · ${entry.orderReference}` : ''}
                        </span>
                      </span>
                      <StatusPill tone={credit ? 'success' : 'neutral'} label={credit ? 'Crédit' : 'Débit'} />
                      <span className={styles.itemAmount}>
                        <MoneyAmount
                          amount={credit ? entry.amount.amount : -entry.amount.amount}
                          currency={entry.amount.currency}
                          signed
                        />
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}