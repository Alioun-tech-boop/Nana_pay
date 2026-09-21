import { Link, useParams } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Icon,
  MoneyAmount,
  Section,
  Skeleton,
  StatusPill,
  Text,
  Timeline,
} from '../../../design-system'
import type { TimelineItemData } from '../../../design-system'
import { orderService, savingsService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition, ORDER_LIFECYCLE } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { PageHeader, ProductTile } from '../../../components/client'
import { productVisualFromName } from '../../marketplace/lib/visual'
import { FINANCING_MODE_ICONS, FINANCING_MODE_LABELS, getLifecycleIndex, isQrAvailable } from '../lib/order'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../orders.module.css'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()

  const order = useRequest(() => orderService.getOrder(orderId), { deps: [orderId] })
  const savings = useRequest(() => savingsService.getSavings({ pageSize: 50 }), {
    deps: [orderId, order.isSuccess],
    enabled: order.isSuccess && order.data?.financingMode === 'SAVINGS',
  })

  if (order.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/purchases" title="Commande" />
        <ErrorState
          title="Commande introuvable"
          description={toUserMessage(order.error)}
          onRetry={() => void order.refresh()}
        />
      </div>
    )
  }

  const data = order.data
  const savingsMatch = savings.data?.items.find((item) => item.orderId === orderId)
  const currentIndex = data ? getLifecycleIndex(data.status) : 0
  const status = data ? getStatusDefinition(data.status) : null
  const financingStatus = data?.financing ? getStatusDefinition(data.financing.status) : null

  const timelineItems: TimelineItemData[] = ORDER_LIFECYCLE.map((step, index) => ({
    title: getStatusDefinition(step).label,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'upcoming',
  }))

  return (
    <div className={viewStyles.page}>
      <PageHeader backTo="/purchases" title={data ? data.reference : 'Chargement…'} />

      {order.isLoading || !data ? (
        <section className={viewStyles.surface}>
          <Skeleton width={220} height={20} />
          <Skeleton width={300} height={16} />
        </section>
      ) : (
        <>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroMeta}>
                <StatusPill tone={status?.tone ?? 'neutral'} label={status?.label ?? data.status} pulse={currentIndex >= ORDER_LIFECYCLE.indexOf('QR_GENERATED') && data.status !== 'COMPLETED'} />
                <span className={styles.heroRef}>{data.reference}</span>
              </div>
              <h2 className={styles.heroTitle}>{data.product.name}</h2>
              <div className={styles.heroMeta}>
                <Icon name="shop" size={14} />
                <span>{data.merchant.name}</span>
                <span aria-hidden="true">·</span>
                <Icon name="calendar" size={14} />
                <span>Commande du {formatDate(data.createdAt)}</span>
              </div>
            </div>
            <div className={styles.heroAmount}>
              <MoneyAmount amount={data.product.price.amount} currency={data.product.price.currency} variant="display" />
              <div>
                <Text muted>{FINANCING_MODE_LABELS[data.financingMode]}</Text>
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            {isQrAvailable(data) ? (
              <Link to={`/orders/${data.id}/qr`}>
                <Button leadingIcon={<Icon name="qr" size={16} />}>Voir le QR de retrait</Button>
              </Link>
            ) : null}
            {data.financingMode === 'SAVINGS' && savingsMatch ? (
              <Link to={`/savings/${savingsMatch.id}`}>
                <Button variant="secondary" leadingIcon={<Icon name="coins" size={16} />}>
                  Suivre mon épargne
                </Button>
              </Link>
            ) : null}
            {data.financingMode === 'VAULT' ? (
              <Link to="/vault">
                <Button variant="secondary" leadingIcon={<Icon name="vault" size={16} />}>Voir le coffre</Button>
              </Link>
            ) : null}
            {data.financingMode === 'CREDIT' ? (
              <Link to="/credit">
                <Button variant="secondary" leadingIcon={<Icon name="bank" size={16} />}>Suivre le crédit</Button>
              </Link>
            ) : null}
          </div>

          <div className={styles.columns}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Détail de la commande</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--np-space-3)', marginBottom: 'var(--np-space-4)' }}>
                <ProductTile icon={productVisualFromName(data.product.name).icon} accent={productVisualFromName(data.product.name).accent} size="sm" />
                <div>
                  <div className={styles.orderTitle}>{data.product.name}</div>
                  <div className={styles.orderReference}>{data.product.id}</div>
                </div>
              </div>
              <dl className={styles.definitionList}>
                <div className={styles.definition}>
                  <dt>Client</dt>
                  <dd>{data.client.fullName}</dd>
                </div>
                <div className={styles.definition}>
                  <dt>Commerçant</dt>
                  <dd>{data.merchant.name}</dd>
                </div>
                <div className={styles.definition}>
                  <dt>Montant</dt>
                  <dd>
                    <MoneyAmount amount={data.product.price.amount} currency={data.product.price.currency} variant="strong" />
                  </dd>
                </div>
                <div className={styles.definition}>
                  <dt>Statut</dt>
                  <dd>
                    <StatusPill tone={status?.tone ?? 'neutral'} label={status?.label ?? data.status} />
                  </dd>
                </div>
                <div className={styles.definition}>
                  <dt>Dernière mise à jour</dt>
                  <dd>{formatDate(data.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Financement</h2>
              <dl className={styles.definitionList}>
                <div className={styles.definition}>
                  <dt>Mode</dt>
                  <dd>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--np-space-2)' }}>
                      <Icon name={FINANCING_MODE_ICONS[data.financingMode]} size={14} />
                      {FINANCING_MODE_LABELS[data.financingMode]}
                    </span>
                  </dd>
                </div>
                <div className={styles.definition}>
                  <dt>Montant financé</dt>
                  <dd>
                    {data.financing ? (
                      <MoneyAmount amount={data.financing.amount.amount} currency={data.financing.amount.currency} />
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className={styles.definition}>
                  <dt>Statut du financement</dt>
                  <dd>
                    {financingStatus ? (
                      <StatusPill tone={financingStatus.tone} label={financingStatus.label} />
                    ) : (
                      'En préparation'
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <Section title="Suivi de la commande">
            <Timeline items={timelineItems} />
          </Section>
        </>
      )}
    </div>
  )
}