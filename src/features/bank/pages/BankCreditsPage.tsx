import { ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { BankCredit } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'En cours' },
  { value: 'COMPLETED', label: 'Soldé' },
  { value: 'DEFAULTED', label: 'En retard' },
]

export function BankCreditsPage() {
  const credits = useRequest(() => bankService.getCredits({ pageSize: 100 }), { deps: [] })
  const rows = credits.data?.items ?? []

  const columns: ProColumn<BankCredit>[] = [
    {
      key: 'reference',
      header: 'Référence',
      sortValue: (row) => row.reference,
      render: (row) => <span className={proStyles.mono}>{row.reference}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (row) => row.clientFullName,
      render: (row) => <Text>{row.clientFullName}</Text>,
    },
    {
      key: 'orderReference',
      header: 'Commande',
      render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
    },
    {
      key: 'principal',
      header: 'Capital',
      align: 'end',
      sortValue: (row) => row.principal.amount,
      render: (row) => <MoneyAmount amount={row.principal.amount} currency={row.principal.currency} />,
    },
    {
      key: 'remaining',
      header: 'Restant',
      align: 'end',
      sortValue: (row) => row.remaining.amount,
      render: (row) => <MoneyAmount amount={row.remaining.amount} currency={row.remaining.currency} variant="strong" />,
    },
    {
      key: 'rate',
      header: 'Taux',
      align: 'end',
      render: (row) => <Text muted>{row.ratePercent} %</Text>,
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
      key: 'nextDueAt',
      header: 'Prochaine échéance',
      render: (row) => <Text muted>{row.nextDueAt ? formatDate(row.nextDueAt) : '—'}</Text>,
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Crédits acceptés" />
      <ProTable
        aria-label="Crédits acceptés"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={credits.isLoading}
        error={
          credits.isError ? (
            <ErrorState
              title="Impossible de charger les crédits"
              description={toUserMessage(credits.error)}
              onRetry={() => void credits.refresh()}
            />
          ) : undefined
        }
        searchable={(row) => `${row.clientFullName} ${row.reference} ${row.orderReference}`}
        searchPlaceholder="Rechercher un crédit…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucun crédit"
        emptyDescription="Les crédits acceptés apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={proStyles.cardStack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.clientFullName}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>
                {row.reference} · {row.orderReference}
              </span>
              <div className={proStyles.cardRow}>
                <MoneyAmount amount={row.remaining.amount} currency={row.remaining.currency} variant="strong" />
                <Text muted>{formatDate(row.createdAt)}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}