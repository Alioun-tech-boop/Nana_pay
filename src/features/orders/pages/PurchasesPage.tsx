import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  MoneyAmount,
  Skeleton,
  StatusPill,
  Tabs,
  Text,
} from '../../../design-system'
import { orderService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { PageHeader, ProductTile } from '../../../components/client'
import { productVisualFromName } from '../../marketplace/lib/visual'
import { FINANCING_MODE_LABELS, getOrderGroup, ORDER_GROUP_LABELS } from '../lib/order'
import type { OrderGroup } from '../lib/order'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../orders.module.css'

type TabId = 'all' | OrderGroup

export function PurchasesPage() {
  const [tab, setTab] = useState<TabId>('all')
  const orders = useRequest(() => orderService.getOrders({ pageSize: 50 }), { deps: [] })

  const items = useMemo(() => orders.data?.items ?? [], [orders.data])
  const counts = useMemo(() => {
    const base: Record<OrderGroup, number> = { active: 0, progress: 0, completed: 0 }
    for (const order of items) base[getOrderGroup(order.status)] += 1
    return base
  }, [items])

  const visible = tab === 'all' ? items : items.filter((order) => getOrderGroup(order.status) === tab)

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Mes achats" />

      <div className={styles.tabsRow}>
        <Tabs
          variant="segmented"
          value={tab}
          onChange={(value) => setTab(value as TabId)}
          items={[
            { id: 'all', label: 'Toutes', count: items.length },
            { id: 'active', label: ORDER_GROUP_LABELS.active, count: counts.active },
            { id: 'progress', label: ORDER_GROUP_LABELS.progress, count: counts.progress },
            { id: 'completed', label: ORDER_GROUP_LABELS.completed, count: counts.completed },
          ]}
        />
      </div>

      {orders.isError ? (
        <ErrorState
          title="Impossible de charger vos achats"
          description={toUserMessage(orders.error)}
          onRetry={() => void orders.refresh()}
        />
      ) : orders.isLoading ? (
        <section className={viewStyles.surface}>
          <Skeleton width={240} height={20} />
          <Skeleton width={280} height={16} />
          <Skeleton width={200} height={16} />
        </section>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={tab === 'all' ? 'Aucun achat pour le moment' : 'Aucune commande dans cette catégorie'}
          description={
            <Text muted>
              Découvrez les produits disponibles et lancez votre premier financement.
            </Text>
          }
          action={
            <Link to="/marketplace">
              <Button leadingIcon={<Icon name="shop" size={16} />}>Explorer le marketplace</Button>
            </Link>
          }
        />
      ) : (
        <div className={styles.list}>
          {visible.map((order) => {
            const status = getStatusDefinition(order.status)
            const visual = productVisualFromName(order.product.name)
            return (
              <Link key={order.id} to={`/orders/${order.id}`} className={styles.orderCard}>
                <ProductTile icon={visual.icon} accent={visual.accent} size="sm" />
                <span className={styles.orderMain}>
                  <span className={styles.orderReference}>{order.reference}</span>
                  <span className={styles.orderTitle}>{order.product.name}</span>
                  <span className={styles.orderMeta}>
                    <Icon name="shop" size={13} />
                    {order.merchant.name}
                    <span aria-hidden="true">·</span>
                    <Icon name="calendar" size={13} />
                    {formatDate(order.createdAt)}
                  </span>
                </span>
                <span className={styles.orderSide}>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.orderAmount}>
                    <MoneyAmount amount={order.product.price.amount} currency={order.product.price.currency} />
                  </span>
                  <Text muted>{FINANCING_MODE_LABELS[order.financingMode]}</Text>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}