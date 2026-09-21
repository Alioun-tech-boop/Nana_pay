import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, ErrorState, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { BankCreditRequest } from '../../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'IN_REVIEW', label: 'En analyse' },
  { value: 'APPROVED', label: 'Acceptée' },
  { value: 'REFUSED', label: 'Refusée' },
  { value: 'CANCELLED', label: 'Annulée' },
]

const RISK_OPTIONS = [
  { value: '', label: 'Tous les risques' },
  { value: 'LOW', label: 'Risque faible' },
  { value: 'MEDIUM', label: 'Risque moyen' },
  { value: 'HIGH', label: 'Risque élevé' },
]

function riskBadge(level: string | undefined) {
  if (level === 'HIGH') return <Badge tone="danger">Élevé</Badge>
  if (level === 'MEDIUM') return <Badge tone="warning">Moyen</Badge>
  if (level === 'LOW') return <Badge tone="success">Faible</Badge>
  return <Badge tone="neutral">—</Badge>
}

export function BankCreditRequestsPage() {
  const navigate = useNavigate()
  const requests = useRequest(() => bankService.getCreditRequests({ pageSize: 100 }), { deps: [] })
  const rows = requests.data?.items ?? []

  const columns: ProColumn<BankCreditRequest>[] = [
    {
      key: 'client',
      header: 'Client',
      sortValue: (row) => row.clientFullName,
      render: (row) => <Text>{row.clientFullName}</Text>,
    },
    {
      key: 'orderReference',
      header: 'Commande',
      sortValue: (row) => row.orderReference,
      render: (row) => <span className={proStyles.mono}>{row.orderReference}</span>,
    },
    {
      key: 'amount',
      header: 'Montant demandé',
      align: 'end',
      sortValue: (row) => row.requestedAmount.amount,
      render: (row) => (
        <MoneyAmount amount={row.requestedAmount.amount} currency={row.requestedAmount.currency} variant="strong" />
      ),
    },
    {
      key: 'term',
      header: 'Durée',
      align: 'end',
      sortValue: (row) => row.termMonths,
      render: (row) => <Text muted>{row.termMonths} mois</Text>,
    },
    {
      key: 'risk',
      header: 'Risque',
      render: (row) => riskBadge(row.riskLevel),
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
      header: 'Demandé le',
      sortValue: (row) => row.createdAt,
      render: (row) => <Text muted>{formatDate(row.createdAt)}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Link to={`/bank/requests/${row.id}`} onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="sm">
            Analyser
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Demandes de crédit" />
      <ProTable
        aria-label="Demandes de crédit"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={requests.isLoading}
        error={
          requests.isError ? (
            <ErrorState
              title="Impossible de charger les demandes"
              description={toUserMessage(requests.error)}
              onRetry={() => void requests.refresh()}
            />
          ) : undefined
        }
        onRowClick={(row) => navigate(`/bank/requests/${row.id}`)}
        searchable={(row) => `${row.clientFullName} ${row.orderReference}`}
        searchPlaceholder="Rechercher un client ou une commande…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
          {
            id: 'risk',
            label: 'Risque',
            options: RISK_OPTIONS,
            test: (row, value) => row.riskLevel === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucune demande"
        emptyDescription="Les demandes de crédit apparaîtront ici."
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={proStyles.cardStack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.clientFullName}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>
                {row.orderReference}
                {' · '}
                {riskBadge(row.riskLevel)}
              </span>
              <div className={proStyles.cardRow}>
                <MoneyAmount amount={row.requestedAmount.amount} currency={row.requestedAmount.currency} variant="strong" />
                <Text muted>{formatDate(row.createdAt)}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}