import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, ErrorState, MoneyAmount, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { BankClientProfile } from '../../../types'

const RISK_OPTIONS = [
  { value: '', label: 'Tous les risques' },
  { value: 'LOW', label: 'Risque faible' },
  { value: 'MEDIUM', label: 'Risque moyen' },
  { value: 'HIGH', label: 'Risque élevé' },
]

function riskBadge(level: BankClientProfile['riskLevel']) {
  if (level === 'HIGH') return <Badge tone="danger">Élevé</Badge>
  if (level === 'MEDIUM') return <Badge tone="warning">Moyen</Badge>
  return <Badge tone="success">Faible</Badge>
}

export function BankClientProfilesPage() {
  const navigate = useNavigate()
  const profiles = useRequest(() => bankService.getProfiles({ pageSize: 100 }), { deps: [] })
  const rows = profiles.data?.items ?? []

  const columns: ProColumn<BankClientProfile>[] = [
    {
      key: 'client',
      header: 'Client',
      sortValue: (row) => row.fullName,
      render: (row) => (
        <span className={proStyles.cellMain}>
          <span className={proStyles.cellTitle}>{row.fullName}</span>
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
      key: 'employer',
      header: 'Employeur',
      render: (row) => <Text muted>{row.employer ?? '—'}</Text>,
    },
    {
      key: 'salary',
      header: 'Salaire vérifié',
      render: (row) => (
        <Badge tone={row.salaryVerified ? 'success' : 'warning'}>
          {row.salaryVerified ? 'Vérifié' : 'Non vérifié'}
        </Badge>
      ),
    },
    {
      key: 'bank',
      header: 'Profil bancaire',
      render: (row) => (
        <Badge tone={row.bankProfileValidated ? 'success' : 'warning'}>
          {row.bankProfileValidated ? 'Validé' : 'Non validé'}
        </Badge>
      ),
    },
    {
      key: 'risk',
      header: 'Risque',
      render: (row) => riskBadge(row.riskLevel),
    },
    {
      key: 'activeCredit',
      header: 'Encours actif',
      align: 'end',
      sortValue: (row) => row.activeCreditAmount?.amount ?? 0,
      render: (row) =>
        row.activeCreditAmount ? (
          <MoneyAmount amount={row.activeCreditAmount.amount} currency={row.activeCreditAmount.currency} variant="strong" />
        ) : (
          <Text muted>—</Text>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Link to={`/bank/profiles/${row.id}`} onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="sm">
            Voir
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Profils clients" />
      <ProTable
        aria-label="Profils clients bancaires"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={profiles.isLoading}
        error={
          profiles.isError ? (
            <ErrorState
              title="Impossible de charger les profils"
              description={toUserMessage(profiles.error)}
              onRetry={() => void profiles.refresh()}
            />
          ) : undefined
        }
        onRowClick={(row) => navigate(`/bank/profiles/${row.id}`)}
        searchable={(row) => `${row.fullName} ${row.email} ${row.city} ${row.employer ?? ''}`}
        searchPlaceholder="Rechercher un client…"
        filters={[
          {
            id: 'risk',
            label: 'Risque',
            options: RISK_OPTIONS,
            test: (row, value) => row.riskLevel === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucun profil"
        emptyDescription="Les clients ayant un profil d’éligibilité apparaîtront ici."
        mobileCard={(row) => (
          <div className={proStyles.cardStack}>
            <div className={proStyles.cardRow}>
              <span className={proStyles.cardTitle}>{row.fullName}</span>
              {riskBadge(row.riskLevel)}
            </div>
            <span className={proStyles.cardMeta}>
              {row.city}
              {' · '}
              {row.employer ?? 'Employeur inconnu'}
            </span>
            <div className={proStyles.cardRow}>
              <Text muted>{formatDate(row.createdAt)}</Text>
              {row.activeCreditAmount ? (
                <MoneyAmount amount={row.activeCreditAmount.amount} currency={row.activeCreditAmount.currency} variant="strong" />
              ) : null}
            </div>
          </div>
        )}
      />
    </div>
  )
}