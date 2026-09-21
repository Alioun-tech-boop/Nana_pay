import { StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AuditEntry } from '../../../types'

export function AdminAuditPage() {
  return (
    <AdminListPage<AuditEntry>
      title="Journal d’audit"
      rowKey={(row) => row.id}
      load={(query) => adminService.getAudit({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'at',
          header: 'Horodatage',
          sortValue: (row) => row.at,
          render: (row) => (
            <Text muted>{formatDate(row.at, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
          ),
        },
        {
          key: 'action',
          header: 'Action',
          render: (row) => <Text>{row.action}</Text>,
        },
        {
          key: 'scope',
          header: 'Domaine',
          render: (row) => <span className={proStyles.mono}>{row.scope}</span>,
        },
        {
          key: 'targetId',
          header: 'Cible',
          render: (row) => <span className={proStyles.mono}>{row.targetId}</span>,
        },
        {
          key: 'actorId',
          header: 'Auteur',
          render: (row) => <span className={proStyles.mono}>{row.actorId}</span>,
        },
        {
          key: 'status',
          header: '',
          render: () => <StatusPill tone="neutral" label="Journalisé" />,
        },
      ]}
      searchable={(row) => `${row.action} ${row.scope} ${row.targetId} ${row.actorId}`}
      searchPlaceholder="Rechercher dans le journal…"
      emptyTitle="Aucune entrée"
      emptyDescription="Les actions sensibles seront tracées ici."
    />
  )
}