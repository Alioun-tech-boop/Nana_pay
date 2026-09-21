import { MoneyAmount, ProgressBar, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminSavingsSummary } from '../../../types'

export function AdminSavingsPage() {
  return (
    <AdminListPage<AdminSavingsSummary>
      title="Épargnes"
      rowKey={(row) => row.id}
      load={(query) => adminService.getSavings({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'orderReference',
          header: 'Commande',
          sortValue: (row) => row.orderReference,
          render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
        },
        {
          key: 'client',
          header: 'Client',
          sortValue: (row) => row.clientFullName,
          render: (row) => <Text>{row.clientFullName}</Text>,
        },
        {
          key: 'progress',
          header: 'Progression',
          render: (row) => (
            <ProgressBar
              value={row.progressPercent}
              tone={row.status === 'FAILED' ? 'danger' : 'success'}
              label={`Progression ${row.progressPercent} %`}
            />
          ),
        },
        {
          key: 'saved',
          header: 'Épargné / Cible',
          align: 'end',
          render: (row) => (
            <span className={proStyles.cellMain}>
              <MoneyAmount amount={row.savedAmount.amount} currency={row.savedAmount.currency} variant="strong" />
              <span className={proStyles.cellMeta}>
                sur{' '}
                <MoneyAmount amount={row.targetAmount.amount} currency={row.targetAmount.currency} noSymbol />
              </span>
            </span>
          ),
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
          key: 'deadline',
          header: 'Échéance',
          render: (row) => <Text muted>{formatDate(row.deadline)}</Text>,
        },
      ]}
      searchable={(row) => `${row.orderReference} ${row.clientFullName}`}
      searchPlaceholder="Rechercher une épargne…"
      emptyTitle="Aucune épargne"
      emptyDescription="Les épargnes progressives apparaîtront ici."
    />
  )
}