import { ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { BankTransfer } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PROCESSING', label: 'En traitement' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'FAILED', label: 'Échoué' },
  { value: 'CANCELLED', label: 'Annulé' },
]

export function BankTransfersPage() {
  const transfers = useRequest(() => bankService.getTransfers({ pageSize: 100 }), { deps: [] })
  const rows = transfers.data?.items ?? []

  const columns: ProColumn<BankTransfer>[] = [
    {
      key: 'reference',
      header: 'Référence',
      sortValue: (row) => row.reference,
      render: (row) => <span className={proStyles.mono}>{row.reference}</span>,
    },
    {
      key: 'client',
      header: 'Bénéficiaire',
      sortValue: (row) => row.clientFullName,
      render: (row) => <Text>{row.clientFullName}</Text>,
    },
    {
      key: 'orderReference',
      header: 'Commande',
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
      key: 'method',
      header: 'Méthode',
      render: (row) => <Text muted>{row.method}</Text>,
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
      render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Virements" />
      <ProTable
        aria-label="Virements bancaires"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={transfers.isLoading}
        error={
          transfers.isError ? (
            <ErrorState
              title="Impossible de charger les virements"
              description={toUserMessage(transfers.error)}
              onRetry={() => void transfers.refresh()}
            />
          ) : undefined
        }
        searchable={(row) => `${row.clientFullName} ${row.reference} ${row.orderReference}`}
        searchPlaceholder="Rechercher un virement…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucun virement"
        emptyDescription="Les virements de financement apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={proStyles.cardStack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.clientFullName}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>
                {row.reference} · {row.method}
              </span>
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