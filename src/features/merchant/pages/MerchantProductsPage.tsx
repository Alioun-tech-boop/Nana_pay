import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, ErrorState, Icon, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { merchantService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn } from '../../../components/pro'
import type { MerchantProduct } from '../../../types'
import styles from '../merchant.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'OUT_OF_STOCK', label: 'Rupture de stock' },
]

export function MerchantProductsPage() {
  const navigate = useNavigate()
  const products = useRequest(() => merchantService.getStoreProducts({ pageSize: 100 }), { deps: [] })
  const rows = products.data?.items ?? []

  const columns: ProColumn<MerchantProduct>[] = [
    {
      key: 'name',
      header: 'Produit',
      sortValue: (row) => row.name,
      render: (row) => (
        <span className={proStyles.cellMain}>
          <span className={proStyles.cellTitle}>{row.name}</span>
          <span className={proStyles.cellMeta}>{row.categoryId ?? 'Sans catégorie'}</span>
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Prix',
      align: 'end',
      sortValue: (row) => row.price.amount,
      render: (row) => <MoneyAmount amount={row.price.amount} currency={row.price.currency} variant="strong" />,
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'end',
      sortValue: (row) => row.stockQuantity,
      render: (row) => (
        <Text muted={row.stockQuantity === 0}>{row.stockQuantity === 0 ? 'Rupture' : row.stockQuantity}</Text>
      ),
    },
    {
      key: 'financing',
      header: 'Financement',
      render: (row) =>
        row.financingEligible ? <Badge tone="info">Éligible</Badge> : <Badge tone="neutral">Non éligible</Badge>,
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
      key: 'updatedAt',
      header: 'Mise à jour',
      sortValue: (row) => row.updatedAt,
      render: (row) => <Text muted>{formatDate(row.updatedAt)}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Link to={`/merchant/products/${row.id}`} onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="sm">
            Modifier
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title="Produits"
        actions={
          <Link to="/merchant/products/new">
            <Button leadingIcon={<Icon name="plus" size={16} />}>Nouveau produit</Button>
          </Link>
        }
      />
      <ProTable
        aria-label="Produits de la boutique"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={products.isLoading}
        error={
          products.isError ? (
            <ErrorState
              title="Impossible de charger les produits"
              description={toUserMessage(products.error)}
              onRetry={() => void products.refresh()}
            />
          ) : undefined
        }
        onRowClick={(row) => navigate(`/merchant/products/${row.id}`)}
        searchable={(row) => `${row.name} ${row.categoryId ?? ''}`}
        searchPlaceholder="Rechercher un produit…"
        filters={[
          {
            id: 'status',
            label: 'Statut',
            options: STATUS_OPTIONS,
            test: (row, value) => row.status === value,
          },
        ]}
        pageSize={10}
        emptyTitle="Aucun produit"
        emptyDescription="Ajoutez un premier produit pour commencer à vendre."
        emptyAction={
          <Link to="/merchant/products/new">
            <Button>Nouveau produit</Button>
          </Link>
        }
        mobileCard={(row) => {
          const status = getStatusDefinition(row.status)
          return (
            <div className={styles.stack}>
              <div className={proStyles.cardRow}>
                <span className={proStyles.cardTitle}>{row.name}</span>
                <StatusPill tone={status.tone} label={status.label} />
              </div>
              <span className={proStyles.cardMeta}>{row.categoryId ?? 'Sans catégorie'}</span>
              <div className={proStyles.cardRow}>
                <MoneyAmount amount={row.price.amount} currency={row.price.currency} variant="strong" />
                <Text muted>Stock : {row.stockQuantity}</Text>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
