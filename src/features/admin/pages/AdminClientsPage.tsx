import { StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminUser } from '../../../types'

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'MERCHANT', label: 'Commerçant' },
  { value: 'BANK', label: 'Banque' },
  { value: 'ADMIN', label: 'Administrateur' },
]

export function AdminClientsPage() {
  return (
    <AdminListPage<AdminUser>
      title="Utilisateurs"
      rowKey={(row) => row.id}
      load={(query) => adminService.getUsers({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'fullName',
          header: 'Nom',
          sortValue: (row) => row.fullName,
          render: (row) => (
            <span className={proStyles.cellMain}>
              <span className={proStyles.cellTitle}>{row.fullName}</span>
            </span>
          ),
        },
        {
          key: 'email',
          header: 'Email',
          render: (row) => <Text muted>{row.email}</Text>,
        },
        {
          key: 'role',
          header: 'Rôle',
          sortValue: (row) => row.role,
          render: (row) => <Text>{row.role}</Text>,
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
          header: 'Inscrit le',
          sortValue: (row) => row.createdAt,
          render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
        },
      ]}
      searchable={(row) => `${row.fullName} ${row.email}`}
      searchPlaceholder="Rechercher un utilisateur…"
      filters={[
        {
          id: 'role',
          label: 'Rôle',
          options: ROLE_OPTIONS,
          test: (row, value) => row.role === value,
        },
      ]}
      emptyTitle="Aucun utilisateur"
      emptyDescription="Les comptes enregistrés apparaîtront ici."
    />
  )
}