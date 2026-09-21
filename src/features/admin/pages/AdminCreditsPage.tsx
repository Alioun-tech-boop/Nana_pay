import { MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminCreditSummary } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'IN_REVIEW', label: 'En analyse' },
  { value: 'APPROVED', label: 'Accepté' },
  { value: 'REFUSED', label: 'Refusé' },
  { value: 'ACTIVE', label: 'En cours' },
  { value: 'COMPLETED', label: 'Soldé' },
  { value: 'DEFAULTED', label: 'En retard' },
]

export function AdminCreditsPage() {
  return (
    <AdminListPage<AdminCreditSummary>
      title="Crédits"
      rowKey={(row) => row.id}
      load={(query) => adminService.getCredits({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'client',
          header: 'Client',
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
      searchable={(row) => `${row.clientFullName} ${row.orderReference}`}
      searchPlaceholder="Rechercher un crédit…"
      filters={[
        {
          id: 'status',
          label: 'Statut',
          options: STATUS_OPTIONS,
          test: (row, value) => row.status === value,
        },
      ]}
      emptyTitle="Aucun crédit"
      emptyDescription="Les crédits enregistrés apparaîtront ici."
    />
  )
}