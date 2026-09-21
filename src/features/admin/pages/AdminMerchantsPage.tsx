import { Badge, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminMerchant } from '../../../types'

export function AdminMerchantsPage() {
  return (
    <AdminListPage<AdminMerchant>
      title="Commerçants"
      rowKey={(row) => row.id}
      load={(query) => adminService.getMerchants({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'name',
          header: 'Boutique',
          sortValue: (row) => row.name,
          render: (row) => (
            <span className={proStyles.cellMain}>
              <span className={proStyles.cellTitle}>{row.name}</span>
              <span className={proStyles.cellMeta}>{row.email}</span>
            </span>
          ),
        },
        {
          key: 'city',
          header: 'Ville',
          render: (row) => <Text>{row.city}</Text>,
        },
        {
          key: 'verified',
          header: 'Vérification',
          render: (row) => (
            <Badge tone={row.verified ? 'success' : 'warning'}>{row.verified ? 'Vérifiée' : 'Non vérifiée'}</Badge>
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
          key: 'productsCount',
          header: 'Produits',
          align: 'end',
          sortValue: (row) => row.productsCount,
          render: (row) => <Text muted>{row.productsCount}</Text>,
        },
        {
          key: 'createdAt',
          header: 'Inscrit le',
          sortValue: (row) => row.createdAt,
          render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
        },
      ]}
      searchable={(row) => `${row.name} ${row.email} ${row.city}`}
      searchPlaceholder="Rechercher un commerçant…"
      emptyTitle="Aucun commerçant"
      emptyDescription="Les boutiques enregistrées apparaîtront ici."
    />
  )
}