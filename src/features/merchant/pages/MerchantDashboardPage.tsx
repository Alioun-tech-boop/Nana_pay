import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Icon,
  Metric,
  MoneyAmount,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { merchantService } from '../../../services'
import { useRequest } from '../../../hooks'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../merchant.module.css'

const ACTION_STATUSES = ['READY_TO_DELIVER', 'QR_GENERATED', 'QR_SCANNED']

export function MerchantDashboardPage() {
  const summary = useRequest(() => merchantService.getSummary(), { deps: [] })
  const orders = useRequest(() => merchantService.getOrders({ pageSize: 50 }), { deps: [] })

  const items = useMemo(() => orders.data?.items ?? [], [orders.data])

  const toHandle = useMemo(
    () => items.filter((order) => ACTION_STATUSES.includes(order.status)),
    [items],
  )

  const recent = useMemo(() => items.slice(0, 5), [items])

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title="Tableau de bord"
        actions={
          <>
            <Link to="/merchant/scan">
              <Button leadingIcon={<Icon name="scan" size={16} />}>Scanner un QR</Button>
            </Link>
            <Link to="/merchant/products/new">
              <Button variant="secondary" leadingIcon={<Icon name="plus" size={16} />}>
                Nouveau produit
              </Button>
            </Link>
          </>
        }
      />

      <div className={proStyles.statGrid}>
        <Metric
          label="Solde disponible"
          icon="wallet"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.balance.amount}
                currency={summary.data.balance.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Règlements en attente"
          icon="clock"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.pendingSettlement.amount}
                currency={summary.data.pendingSettlement.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Commandes à livrer"
          icon="receipt"
          loading={summary.isLoading}
          value={summary.data?.ordersToDeliver}
        />
        <Metric
          label="Retraits à confirmer"
          icon="scan"
          loading={summary.isLoading}
          value={summary.data?.awaitingWithdrawal}
        />
        <Metric
          label="Ventes enregistrées"
          icon="coins"
          loading={summary.isLoading}
          value={
            summary.data ? (
              <MoneyAmount
                amount={summary.data.salesThisMonth.amount}
                currency={summary.data.salesThisMonth.currency}
                variant="strong"
              />
            ) : undefined
          }
        />
        <Metric
          label="Produits en rupture"
          icon="box"
          loading={summary.isLoading}
          value={summary.data?.productsOutOfStock}
        />
      </div>

      <div className={styles.quickGrid}>
        <Link to="/merchant/orders" className={styles.quickLink}>
          <span className={styles.quickIcon} aria-hidden="true">
            <Icon name="receipt" size={18} />
          </span>
          Commandes
        </Link>
        <Link to="/merchant/products" className={styles.quickLink}>
          <span className={styles.quickIcon} aria-hidden="true">
            <Icon name="box" size={18} />
          </span>
          Produits
        </Link>
        <Link to="/merchant/payments" className={styles.quickLink}>
          <span className={styles.quickIcon} aria-hidden="true">
            <Icon name="wallet" size={18} />
          </span>
          Paiements
        </Link>
        <Link to="/merchant/store" className={styles.quickLink}>
          <span className={styles.quickIcon} aria-hidden="true">
            <Icon name="shop" size={18} />
          </span>
          Boutique
        </Link>
      </div>

      <Section title="À traiter">
        {orders.isLoading ? (
          <div className={proStyles.panel}>
            <Skeleton width={240} height={16} />
            <Skeleton width={280} height={16} />
          </div>
        ) : toHandle.length === 0 ? (
          <Text muted>Aucune commande en attente d’action pour le moment.</Text>
        ) : (
          <div className={styles.list}>
            {toHandle.map((order) => {
              const status = getStatusDefinition(order.status)
              return (
                <Link key={order.id} to={`/merchant/orders/${order.id}`} className={styles.row}>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{order.productName}</span>
                    <span className={styles.rowMeta}>
                      {order.reference} · {order.clientFullName} · {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.rowAmount}>
                    <MoneyAmount amount={order.amount.amount} currency={order.amount.currency} />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Dernières commandes">
        {orders.isLoading ? (
          <div className={proStyles.panel}>
            <Skeleton width={240} height={16} />
            <Skeleton width={280} height={16} />
          </div>
        ) : recent.length === 0 ? (
          <Text muted>Aucune commande enregistrée.</Text>
        ) : (
          <div className={styles.list}>
            {recent.map((order) => {
              const status = getStatusDefinition(order.status)
              return (
                <Link key={order.id} to={`/merchant/orders/${order.id}`} className={styles.row}>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{order.productName}</span>
                    <span className={styles.rowMeta}>
                      {order.reference} · {order.clientFullName}
                    </span>
                  </span>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.rowAmount}>
                    <MoneyAmount amount={order.amount.amount} currency={order.amount.currency} />
                  </span>
                </Link>
              )
            })}
            <div className={proStyles.actions}>
              <Link to="/merchant/orders">
                <Button variant="ghost">Voir toutes les commandes</Button>
              </Link>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
