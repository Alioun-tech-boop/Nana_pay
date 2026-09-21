import { Link } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Icon,
  InlineAlert,
  Metric,
  MoneyAmount,
  ProgressBar,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { creditService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'
const creditHeroImage = '/assets/credit-card-bg.jpeg'

export function CreditPage() {
  const eligibility = useRequest(() => creditService.getEligibility(), { deps: [] })
  const credit = useRequest(() => creditService.getCredit(), { deps: [] })
  const requests = useRequest(() => creditService.getCreditRequests({ pageSize: 25 }), { deps: [] })

  if (credit.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader title="Crédit bancaire" />
        <ErrorState
          title="Crédit indisponible"
          description={toUserMessage(credit.error)}
          onRetry={() => void credit.refresh()}
        />
      </div>
    )
  }

  const data = credit.data
  const paidPercent =
    data && data.principal.amount > 0
      ? Math.round(((data.principal.amount - data.remaining.amount) / data.principal.amount) * 100)
      : 0
  const status = data ? getStatusDefinition(data.status) : null

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Crédit bancaire" />

      {credit.isLoading ? (
        <section className={viewStyles.surface}>
          <Skeleton width={160} height={20} />
          <Skeleton width={280} height={16} />
        </section>
      ) : data ? (
        <>
          <section
            className={styles.hero}
            style={{ backgroundImage: `url(${creditHeroImage})` }}
            aria-labelledby="credit-hero-title"
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <span className={`${styles.heroIcon} ${styles['heroIcon--brand']}`} aria-hidden="true">
                <Icon name="bank" size={26} />
              </span>
              <div>
                <div className={styles.heroMeta}>
                  <StatusPill tone={status?.tone ?? 'neutral'} label={status?.label ?? data.status} />
                  <span className={styles.heroReference}>{data.reference}</span>
                </div>
                <h2 id="credit-hero-title" className={styles.heroTitle}>
                  <MoneyAmount amount={data.remaining.amount} currency={data.remaining.currency} variant="display" animate />
                </h2>
                <p className={styles.heroMeta}>
                  restant à rembourser sur un principal de{' '}
                  <MoneyAmount amount={data.principal.amount} currency={data.principal.currency} variant="strong" />
                </p>
                <div className={styles.heroProgress}>
                  <ProgressBar value={paidPercent} label="Remboursement du crédit" showLabel />
                </div>
                <div className={styles.heroActions}>
                  {data.nextDueAt ? (
                    <Text muted>
                      Prochaine échéance le {formatDate(data.nextDueAt)}
                    </Text>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <div className={styles.metricGrid}>
            <Metric
              label="Principal"
              icon="money"
              value={<MoneyAmount amount={data.principal.amount} currency={data.principal.currency} />}
            />
            <Metric
              label="Restant dû"
              icon="wallet"
              value={<MoneyAmount amount={data.remaining.amount} currency={data.remaining.currency} />}
            />
            <Metric label="Taux annuel" icon="receipt" value={`${data.ratePercent} %`} />
            <Metric
              label="Prochaine échéance"
              icon="calendar"
              value={data.nextDueAt ? formatDate(data.nextDueAt) : '—'}
            />
          </div>
        </>
      ) : (
        <>
          <section className={styles.hero}>
            <span className={`${styles.heroIcon} ${styles['heroIcon--brand']}`} aria-hidden="true">
              <Icon name="bank" size={26} />
            </span>
            <div>
              <h2 className={styles.heroTitle}>Aucun crédit en cours</h2>
              <p className={styles.heroMeta}>
                {eligibility.data?.eligible
                  ? 'Vous pouvez demander un crédit pour financer un produit du marketplace.'
                  : 'Votre éligibilité au crédit sera évaluée par la banque.'}
              </p>
              <div className={styles.heroActions}>
                <Link to="/marketplace">
                  <Button leadingIcon={<Icon name="shop" size={16} />}>Financer un achat</Button>
                </Link>
              </div>
            </div>
          </section>

          {eligibility.data && !eligibility.data.eligible ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="warning" title="Crédit non disponible">
                <Text muted>
                  {eligibility.data.reasons.length > 0
                    ? eligibility.data.reasons.join(' · ')
                    : 'Votre profil ne remplit pas encore les conditions.'}
                </Text>
              </InlineAlert>
            </div>
          ) : null}
        </>
      )}

      <Section title="Demandes de crédit">
        {requests.isLoading ? (
          <section className={viewStyles.surface}>
            <Skeleton width={220} height={16} />
            <Skeleton width={260} height={16} />
          </section>
        ) : (requests.data?.items.length ?? 0) === 0 ? (
          <Text muted>Aucune demande de crédit pour le moment.</Text>
        ) : (
          <div className={styles.list}>
            {requests.data?.items.map((request) => {
              const requestStatus = getStatusDefinition(request.status)
              return (
                <div key={request.id} className={styles.item}>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name="receipt" size={18} />
                  </span>
                  <span className={styles.itemMain}>
                    <span className={styles.itemTitle}>{request.orderReference}</span>
                    <span className={styles.itemMuted}>
                      {request.termMonths} mois · {formatDate(request.createdAt)}
                      {request.decisionReason ? ` · ${request.decisionReason}` : ''}
                    </span>
                  </span>
                  <StatusPill tone={requestStatus.tone} label={requestStatus.label} />
                  <span className={styles.itemAmount}>
                    <MoneyAmount amount={request.requestedAmount.amount} currency={request.requestedAmount.currency} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}