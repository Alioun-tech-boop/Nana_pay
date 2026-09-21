import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Icon,
  Metric,
  MoneyAmount,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../bank.module.css'

export function BankDashboardPage() {
  const summary = useRequest(() => bankService.getSummary(), { deps: [] })
  const requests = useRequest(() => bankService.getCreditRequests({ pageSize: 50 }), { deps: [] })

  const queue = useMemo(() => {
    const items = requests.data?.items ?? []
    return items.filter((request) => request.status === 'IN_REVIEW')
  }, [requests.data])

  const pending = summary.data?.requestsToReview ?? queue.length

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title="Analyse crédit"
        actions={
          <Link to="/bank/requests">
            <Button leadingIcon={<Icon name="receipt" size={16} />}>Analyser les demandes</Button>
          </Link>
        }
      />

      <div className={proStyles.statGrid}>
        <Metric label="Demandes à analyser" icon="receipt" loading={summary.isLoading} value={pending} />
        <Metric
          label="Crédits accordés (mois)"
          icon="check-circle"
          loading={summary.isLoading}
          value={summary.data?.approvedThisMonth}
        />
        <Metric
          label="Demandes refusées (mois)"
          icon="alert-circle"
          loading={summary.isLoading}
          value={summary.data?.refusedThisMonth}
        />
        <Metric
          label="Débloqués ce mois"
          icon="bank"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.disbursedThisMonth.amount}
                currency={summary.data.disbursedThisMonth.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Encours de crédit"
          icon="coins"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.portfolioOutstanding.amount}
                currency={summary.data.portfolioOutstanding.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Taux de retard"
          icon="clock"
          loading={summary.isLoading}
          value={summary.data ? `${summary.data.defaultRate.toFixed(1)} %` : undefined}
        />
      </div>

      <Section
        title="File d’attente"
        actions={
          <div className={proStyles.actions}>
            <Link to="/bank/requests">
              <Button variant="ghost">Tout voir</Button>
            </Link>
          </div>
        }
      >
        {requests.isLoading ? (
          <div className={proStyles.panel}>
            <Skeleton width={240} height={16} />
            <Skeleton width={280} height={16} />
          </div>
        ) : queue.length === 0 ? (
          <Text muted>Aucune demande en attente d’analyse.</Text>
        ) : (
          <div className={styles.queue}>
            {queue.map((request) => {
              const status = getStatusDefinition(request.status)
              return (
                <Link key={request.id} to={`/bank/requests/${request.id}`} className={styles.queueRow}>
                  <span className={proStyles.cellMain}>
                    <span className={proStyles.cellTitle}>{request.clientFullName}</span>
                    <span className={proStyles.cellMeta}>
                      {request.orderReference} · {formatDate(request.createdAt)}
                    </span>
                  </span>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.queueAmount}>
                    <MoneyAmount
                      amount={request.requestedAmount.amount}
                      currency={request.requestedAmount.currency}
                      variant="strong"
                    />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}