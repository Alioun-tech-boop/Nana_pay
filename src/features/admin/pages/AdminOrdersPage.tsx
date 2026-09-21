import { MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminOrderSummary } from '../../../types'

export function AdminOrdersPage() {
  return (
    <AdminListPage<AdminOrderSummary>
      title="Commandes"
      rowKey={(row) => row.id}
      load={(query) => adminService.getOrders({ pageSize: query.pageSize })}
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
          header: 'Créée le',
          sortValue: (row) => row.createdAt,
          render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
        },
      ]}
      searchable={(row) => `${row.reference} ${row.clientFullName}`}
      searchPlaceholder="Rechercher une commande…"
      emptyTitle="Aucune commande"
      emptyDescription="Les commandes enregistrées apparaîtront ici."
    />
  )
}