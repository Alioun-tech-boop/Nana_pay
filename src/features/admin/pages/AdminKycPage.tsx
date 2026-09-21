import { StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminKycRecord } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'VERIFIED', label: 'Vérifié' },
  { value: 'REJECTED', label: 'Rejeté' },
]

export function AdminKycPage() {
  return (
    <AdminListPage<AdminKycRecord>
      title="Vérifications KYC"
      rowKey={(row) => row.id}
      load={(query) => adminService.getKyc({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'client',
          header: 'Client',
          sortValue: (row) => row.clientFullName,
          render: (row) => (
            <span className={proStyles.cellMain}>
              <span className={proStyles.cellTitle}>{row.clientFullName}</span>
              <span className={proStyles.cellMeta}>{row.reference}</span>
            </span>
          ),
        },
        {
          key: 'documentType',
          header: 'Document',
          render: (row) => <Text>{row.documentType}</Text>,
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
          key: 'submittedAt',
          header: 'Soumis le',
          sortValue: (row) => row.submittedAt,
          render: (row) => <Text muted>{formatDate(row.submittedAt)}</Text>,
        },
        {
          key: 'reviewedAt',
          header: 'Examiné le',
          render: (row) => <Text muted>{row.reviewedAt ? formatDate(row.reviewedAt) : '—'}</Text>,
        },
      ]}
      searchable={(row) => `${row.clientFullName} ${row.reference} ${row.documentType}`}
      searchPlaceholder="Rechercher une vérification…"
      filters={[
        {
          id: 'status',
          label: 'Statut',
          options: STATUS_OPTIONS,
          test: (row, value) => row.status === value,
        },
      ]}
      emptyTitle="Aucune vérification"
      emptyDescription="Les vérifications KYC apparaîtront ici."
    />
  )
}