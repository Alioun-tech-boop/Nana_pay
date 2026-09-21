import { MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminWithdrawalRecord } from '../../../types'

export function AdminWithdrawalsPage() {
  return (
    <AdminListPage<AdminWithdrawalRecord>
      title="Retraits"
      rowKey={(row) => row.id}
      load={(query) => adminService.getWithdrawals({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'orderReference',
          header: 'Commande',
          sortValue: (row) => row.orderReference,
          render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
        },
        {
          key: 'merchantName',
          header: 'Marchand',
          sortValue: (row) => row.merchantName,
          render: (row) => <Text>{row.merchantName}</Text>,
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
      ]}
      searchable={(row) => `${row.orderReference} ${row.merchantName}`}
      searchPlaceholder="Rechercher un retrait…"
      emptyTitle="Aucun retrait"
      emptyDescription="Les retraits enregistrés apparaîtront ici."
    />
  )
}