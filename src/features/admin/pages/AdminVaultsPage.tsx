import { Badge, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminVaultSummary } from '../../../types'

export function AdminVaultsPage() {
  return (
    <AdminListPage<AdminVaultSummary>
      title="Coffres"
      rowKey={(row) => row.id}
      load={(query) => adminService.getVaults({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'client',
          header: 'Client',
          sortValue: (row) => row.clientFullName,
          render: (row) => (
            <span className={proStyles.cellMain}>
              <span className={proStyles.cellTitle}>{row.clientFullName}</span>
            </span>
          ),
        },
        {
          key: 'balance',
          header: 'Solde',
          align: 'end',
          sortValue: (row) => row.balance.amount,
          render: (row) => <MoneyAmount amount={row.balance.amount} currency={row.balance.currency} variant="strong" />,
        },
        {
          key: 'contribution',
          header: 'Contribution mensuelle',
          align: 'end',
          render: (row) =>
            row.monthlyContribution ? (
              <MoneyAmount amount={row.monthlyContribution.amount} currency={row.monthlyContribution.currency} />
            ) : (
              <Text muted>—</Text>
            ),
        },
        {
          key: 'eligible',
          header: 'Éligibilité',
          render: (row) => (
            <Badge tone={row.eligible ? 'success' : 'neutral'}>{row.eligible ? 'Éligible' : 'Non éligible'}</Badge>
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
      ]}
      searchable={(row) => row.clientFullName}
      searchPlaceholder="Rechercher un client…"
      emptyTitle="Aucun coffre"
      emptyDescription="Les coffres NanoPay apparaîtront ici."
    />
  )
}