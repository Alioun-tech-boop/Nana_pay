import { MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminPaymentSummary } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PROCESSING', label: 'En traitement' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'FAILED', label: 'Échoué' },
  { value: 'REFUNDED', label: 'Remboursé' },
  { value: 'CANCELLED', label: 'Annulé' },
]

export function AdminPaymentsPage() {
  return (
    <AdminListPage<AdminPaymentSummary>
      title="Paiements"
      rowKey={(row) => row.id}
      load={(query) => adminService.getPayments({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'reference',
          header: 'Référence',
          sortValue: (row) => row.reference,
          render: (row) => <span className={proStyles.mono}>{row.reference}</span>,
        },
        {
          key: 'client',
          header: 'Client',
          sortValue: (row) => row.clientFullName,
          render: (row) => <Text>{row.clientFullName}</Text>,
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
          render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
        },
      ]}
      searchable={(row) => `${row.reference} ${row.clientFullName}`}
      searchPlaceholder="Rechercher un paiement…"
      filters={[
        {
          id: 'status',
          label: 'Statut',
          options: STATUS_OPTIONS,
          test: (row, value) => row.status === value,
        },
      ]}
      emptyTitle="Aucun paiement"
      emptyDescription="Les paiements enregistrés apparaîtront ici."
    />
  )
}