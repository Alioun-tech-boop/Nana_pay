import { ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { Settlement } from '../../../types'

export function BankSettlementsPage() {
  const settlements = useRequest(() => bankService.getSettlements({ pageSize: 100 }), { deps: [] })
  const rows = settlements.data?.items ?? []

  const columns: ProColumn<Settlement>[] = [
    {
      key: 'orderReference',
      header: 'Commande',
      sortValue: (row) => row.orderReference,
      render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
    },
    {
      key: 'merchantId',
      header: 'Commerçant',
      render: (row) => <span className={proStyles.mono}>{row.merchantId}</span>,
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
      render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Règlements" />
      <ProTable
        aria-label="Règlements commerçants"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={settlements.isLoading}
        error={
          settlements.isError ? (
            <ErrorState
              title="Impossible de charger les règlements"
              description={toUserMessage(settlements.error)}
              onRetry={() => void settlements.refresh()}
            />
          ) : undefined
        }
        searchable={(row) => `${row.orderReference} ${row.merchantId}`}
        searchPlaceholder="Rechercher un règlement…"
        pageSize={10}
        emptyTitle="Aucun règlement"
        emptyDescription="Les règlements commerçants apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={proStyles.cardStack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.orderReference}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>{row.merchantId}</span>
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