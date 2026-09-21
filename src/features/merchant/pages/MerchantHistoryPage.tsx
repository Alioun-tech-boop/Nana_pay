import { ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { merchantService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { MerchantTransaction } from '../../../types'
import styles from '../merchant.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PROCESSING', label: 'En traitement' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'WITHDRAWN', label: 'Retiré' },
  { value: 'FAILED', label: 'Échoué' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'REFUNDED', label: 'Remboursé' },
]

export function MerchantHistoryPage() {
  const transactions = useRequest(() => merchantService.getTransactions({ pageSize: 100 }), { deps: [] })
  const rows = transactions.data?.items ?? []

  const columns: ProColumn<MerchantTransaction>[] = [
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
      key: 'createdAt',
      header: 'Date',
      sortValue: (row) => row.createdAt,
      render: (row) => <Text muted>{formatDate(row.createdAt, { hour: '2-digit', minute: '2-digit' })}</Text>,
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Historique" />
      <ProTable
        aria-label="Historique des retraits"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={transactions.isLoading}
        error={
          transactions.isError ? (
            <ErrorState
              title="Impossible de charger l’historique"
              description={toUserMessage(transactions.error)}
              onRetry={() => void transactions.refresh()}
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
        pageSize={15}
        emptyTitle="Aucun mouvement"
        emptyDescription="Les retraits confirmés apparaîtront dans cet historique."
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
                <Text muted>{formatDate(row.createdAt)}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
