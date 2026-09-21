import { StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminQrRecord } from '../../../types'

export function AdminQrPage() {
  return (
    <AdminListPage<AdminQrRecord>
      title="QR de retrait"
      rowKey={(row) => row.id}
      load={(query) => adminService.getQr({ pageSize: query.pageSize })}
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
          key: 'state',
          header: 'État',
          render: (row) => {
            const status = getStatusDefinition(row.state)
            return <StatusPill tone={status.tone} label={status.label} />
          },
        },
        {
          key: 'generatedAt',
          header: 'Généré le',
          sortValue: (row) => row.generatedAt,
          render: (row) => <Text muted>{formatDate(row.generatedAt, { hour: '2-digit', minute: '2-digit' })}</Text>,
        },
        {
          key: 'expiresAt',
          header: 'Expire le',
          sortValue: (row) => row.expiresAt,
          render: (row) => <Text muted>{formatDate(row.expiresAt, { hour: '2-digit', minute: '2-digit' })}</Text>,
        },
      ]}
      searchable={(row) => `${row.orderReference} ${row.merchantName}`}
      searchPlaceholder="Rechercher un QR…"
      emptyTitle="Aucun QR"
      emptyDescription="Les QR générés apparaîtront ici."
    />
  )
}