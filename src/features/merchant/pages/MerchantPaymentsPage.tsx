import { ErrorState, Metric, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { merchantService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { MerchantPayment } from '../../../types'
import styles from '../merchant.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING_SETTLEMENT', label: 'En attente de règlement' },
  { value: 'SETTLED', label: 'Réglé' },
]

export function MerchantPaymentsPage() {
  const payments = useRequest(() => merchantService.getPayments({ pageSize: 100 }), { deps: [] })
  const balance = useRequest(() => merchantService.getBalance(), { deps: [] })
  const summary = useRequest(() => merchantService.getSummary(), { deps: [] })

  const rows = payments.data?.items ?? []

  const columns: ProColumn<MerchantPayment>[] = [
    {
      key: 'orderReference',
      header: 'Commande',
      sortValue: (row) => row.orderReference,
      render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
    },
    {
      key: 'amount',
      header: 'Montant',
      align: 'end',
      sortValue: (row) => row.amount.amount,
      render: (row) => <MoneyAmount amount={row.amount.amount} currency={row.amount.currency} variant="strong" />,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => {
        const status = getStatusDefinition(row.status)
        return <StatusPill tone={status.tone} label={status.label} />
      },
    },
    {
      key: 'settledAt',
      header: 'Réglé le',
      sortValue: (row) => row.settledAt ?? '',
      render: (row) => <Text muted>{row.settledAt ? formatDate(row.settledAt) : '—'}</Text>,
    },
    {
      key: 'createdAt',
      header: 'Reçu le',
      sortValue: (row) => row.createdAt,
      render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Paiements" />

      <div className={proStyles.statGrid}>
        <Metric
          label="Solde disponible"
          icon="wallet"
          loading={balance.isLoading}
          value={
            balance.data ? (
              <MoneyAmount amount={balance.data.amount} currency={balance.data.currency} variant="strong" />
            ) : undefined
          }
        />
        <Metric
          label="Règlements en attente"
          icon="clock"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.pendingSettlement.amount}
                currency={summary.data.pendingSettlement.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Retraits confirmés"
          icon="check-circle"
          loading={summary.isLoading}
          value={rows.length}
        />
      </div>

      <ProTable
        aria-label="Paiements de la boutique"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={payments.isLoading}
        error={
          payments.isError ? (
            <ErrorState
              title="Impossible de charger les paiements"
              description={toUserMessage(payments.error)}
              onRetry={() => void payments.refresh()}
            />
          ) : undefined
        }
        searchable={(row) => row.orderReference}
        searchPlaceholder="Rechercher une commande…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucun paiement"
        emptyDescription="Les retraits confirmés apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={styles.stack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.orderReference}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <div className={proStyles.cardRow}>
                <MoneyAmount amount={row.amount.amount} currency={row.amount.currency} variant="strong" />
                <Text muted>{row.settledAt ? formatDate(row.settledAt) : '—'}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
