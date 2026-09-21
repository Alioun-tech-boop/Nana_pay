import { MoneyAmount, StatusPill, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { AdminListPage } from './AdminListPage'
import { proStyles } from '../../../components/pro'
import type { AdminTransactionRecord } from '../../../types'

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'PAYMENT', label: 'Paiement' },
  { value: 'WITHDRAWAL', label: 'Retrait' },
  { value: 'SETTLEMENT', label: 'Règlement' },
  { value: 'TRANSFER', label: 'Virement' },
  { value: 'SAVINGS_PAYMENT', label: 'Épargne' },
  { value: 'CREDIT_DISBURSEMENT', label: 'Déblocage crédit' },
  { value: 'MERCHANT_PAYMENT', label: 'Paiement commerçant' },
]

const TYPE_LABELS: Record<string, string> = {
  QR_GENERATED: 'QR généré',
  WITHDRAWAL: 'Retrait',
  SETTLEMENT: 'Règlement',
  TRANSFER: 'Virement',
  SAVINGS_PAYMENT: 'Épargne',
  CREDIT_DISBURSEMENT: 'Déblocage crédit',
  MERCHANT_PAYMENT: 'Paiement commerçant',
  PAYMENT: 'Paiement',
}

export function AdminTransactionsPage() {
  return (
    <AdminListPage<AdminTransactionRecord>
      title="Transactions"
      rowKey={(row) => row.id}
      load={(query) => adminService.getTransactions({ pageSize: query.pageSize })}
      columns={[
        {
          key: 'reference',
          header: 'Référence',
          sortValue: (row) => row.reference,
          render: (row) => <span className={proStyles.mono}>{row.reference}</span>,
        },
        {
          key: 'type',
          header: 'Type',
          sortValue: (row) => row.type,
          render: (row) => <Text>{TYPE_LABELS[row.type] ?? row.type}</Text>,
        },
        {
          key: 'client',
          header: 'Client',
          sortValue: (row) => row.clientFullName,
          render: (row) => <Text>{row.clientFullName}</Text>,
        },
        {
          key: 'merchant',
          header: 'Marchand',
          render: (row) => <Text muted>{row.merchantName ?? '—'}</Text>,
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
          render: (row) => (
            <Text muted>{formatDate(row.createdAt, { hour: '2-digit', minute: '2-digit' })}</Text>
          ),
        },
      ]}
      searchable={(row) => `${row.reference} ${row.clientFullName} ${row.merchantName ?? ''}`}
      searchPlaceholder="Rechercher une transaction…"
      filters={[
        {
          id: 'type',
          label: 'Type',
          options: TYPE_OPTIONS,
          test: (row, value) => row.type === value,
        },
      ]}
      emptyTitle="Aucune transaction"
      emptyDescription="Les mouvements financiers apparaîtront ici."
    />
  )
}