import { Link, useNavigate } from 'react-router-dom'
import { Button, ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { merchantService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { MerchantOrderDetail } from '../../../types'
import styles from '../merchant.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'FINANCING_IN_PROGRESS', label: 'Financement en cours' },
  { value: 'FINANCED', label: 'Financée' },
  { value: 'READY_TO_DELIVER', label: 'Prête à livrer' },
  { value: 'QR_GENERATED', label: 'QR généré' },
  { value: 'QR_SCANNED', label: 'QR scanné' },
  { value: 'WITHDRAWAL_CONFIRMED', label: 'Retrait confirmé' },
  { value: 'DELIVERED', label: 'Livrée' },
  { value: 'MERCHANT_PAID', label: 'Commerçant payé' },
  { value: 'COMPLETED', label: 'Terminée' },
]

export function MerchantOrdersPage() {
  const navigate = useNavigate()
  const orders = useRequest(() => merchantService.getOrders({ pageSize: 100 }), { deps: [] })
  const rows = orders.data?.items ?? []

  const columns: ProColumn<MerchantOrderDetail>[] = [
    {
      key: 'reference',
      header: 'Commande',
      sortValue: (row) => row.reference,
      render: (row) => (
        <span className={proStyles.cellMain}>
          <span className={proStyles.cellTitle}>{row.productName}</span>
          <span className={proStyles.cellMeta}>
            {row.reference} · Qté {row.quantity}
          </span>
        </span>
      ),
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
      render: (row) => (
        <MoneyAmount amount={row.amount.amount} currency={row.amount.currency} variant="strong" />
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
      key: 'createdAt',
      header: 'Date',
      sortValue: (row) => row.createdAt,
      render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Link to={`/merchant/orders/${row.id}`} onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="sm">
            Détail
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Commandes" />
      <ProTable
        aria-label="Commandes de la boutique"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={orders.isLoading}
        error={
          orders.isError ? (
            <ErrorState
              title="Impossible de charger les commandes"
              description={toUserMessage(orders.error)}
              onRetry={() => void orders.refresh()}
            />
          ) : undefined
        }
        onRowClick={(row) => navigate(`/merchant/orders/${row.id}`)}
        searchable={(row) => `${row.reference} ${row.clientFullName} ${row.productName}`}
        searchPlaceholder="Rechercher une commande…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucune commande"
        emptyDescription="Les commandes de votre boutique apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={styles.stack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.productName}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>
                {row.reference} · {row.clientFullName}
              </span>
              <div className={proStyles.cardRow}>
                <MoneyAmount amount={row.amount.amount} currency={row.amount.currency} variant="strong" />
                <Text muted>{formatDate(row.createdAt)}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
