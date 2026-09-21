import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  InlineAlert,
  MoneyAmount,
  Skeleton,
  StatusPill,
  Text,
  Timeline,
} from '../../../design-system'
import type { TimelineItemData } from '../../../design-system'
import type { OrderStatus } from '../../../types'
import { merchantService } from '../../../services'
import { useMutation, useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition, ORDER_LIFECYCLE } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { FINANCING_MODE_LABELS, getLifecycleIndex } from '../../orders/lib/order'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../merchant.module.css'

export function MerchantOrderDetailPage() {
  const { orderId = '' } = useParams()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const order = useRequest(() => merchantService.getOrder(orderId), { deps: [orderId] })

  const settle = useMutation(
    (idempotencyKey: string) => merchantService.settle({ orderId, idempotencyKey }),
    {
      onSuccess: () => {
        setConfirmOpen(false)
        setFeedback('Règlement confirmé par NanoPay pour cette commande.')
        void order.refresh()
      },
    },
  )

  if (order.isError) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Détail de la commande" />
        <ErrorState
          title="Impossible de charger la commande"
          description={toUserMessage(order.error)}
          onRetry={() => void order.refresh()}
        />
      </div>
    )
  }

  if (order.isLoading || !order.data) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Détail de la commande" />
        <div className={proStyles.panel}>
          <Skeleton width={220} height={20} />
          <Skeleton width={320} height={16} />
          <Skeleton width={260} height={16} />
        </div>
      </div>
    )
  }

  const data = order.data
  const status = getStatusDefinition(data.status)
  const currentIndex = getLifecycleIndex(data.status as OrderStatus)
  const canSettle =
    data.withdrawalStatus === 'CONFIRMED' && data.status !== 'MERCHANT_PAID' && data.status !== 'COMPLETED'

  const timeline: TimelineItemData[] = ORDER_LIFECYCLE.map((step, index) => ({
    title: getStatusDefinition(step).label,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'upcoming',
  }))

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title={data.productName}
        meta={<StatusPill tone={status.tone} label={status.label} />}
        actions={
          canSettle ? (
            <Button leadingIcon={<Icon name="check-circle" size={16} />} onClick={() => setConfirmOpen(true)}>
              Confirmer le règlement
            </Button>
          ) : undefined
        }
      />

      {feedback ? (
        <InlineAlert
          tone="success"
          title={feedback}
          action={
            <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}>
              Fermer
            </Button>
          }
        />
      ) : null}

      <div className={proStyles.twoCol}>
        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Commande</h2>
          <dl className={proStyles.definitionList}>
            <div className={proStyles.definition}>
              <dt>Référence</dt>
              <dd>{data.reference}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Client</dt>
              <dd>{data.clientFullName}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Produit</dt>
              <dd>{data.productName}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Quantité</dt>
              <dd>{data.quantity}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Mode de financement</dt>
              <dd>{FINANCING_MODE_LABELS[data.financingMode]}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Montant</dt>
              <dd>
                <MoneyAmount amount={data.amount.amount} currency={data.amount.currency} variant="strong" />
              </dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Commandé le</dt>
              <dd>{formatDate(data.createdAt)}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Dernière mise à jour</dt>
              <dd>{formatDate(data.updatedAt)}</dd>
            </div>
          </dl>

          <div className={proStyles.actions} style={{ marginTop: 'var(--np-space-4)' }}>
            <Badge tone={data.qrState ? 'info' : 'neutral'}>
              QR : {data.qrState ? getStatusDefinition(data.qrState).label : 'non généré'}
            </Badge>
            <Badge tone={data.withdrawalStatus ? 'success' : 'neutral'}>
              Retrait :{' '}
              {data.withdrawalStatus ? getStatusDefinition(data.withdrawalStatus).label : 'en attente'}
            </Badge>
          </div>
        </section>

        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Cycle de la commande</h2>
          <Timeline items={timeline} />
        </section>
      </div>

      <Text muted>
        Le règlement n’est possible qu’après confirmation du retrait par NanoPay. Cette page reflète
        l’état transmis par le backend.
      </Text>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void settle.mutate(crypto.randomUUID())}
        title="Confirmer le règlement"
        body={
          <div className={styles.stack}>
            <p>
              Commande {data.reference} · {data.productName}
            </p>
            <p>
              Montant à régler :{' '}
              <MoneyAmount amount={data.amount.amount} currency={data.amount.currency} variant="strong" />
            </p>
            <p>Le règlement sera enregistré après validation du backend.</p>
            {settle.isError ? <InlineAlert tone="danger" title={toUserMessage(settle.error)} /> : null}
          </div>
        }
        confirmLabel="Confirmer le règlement"
        loading={settle.isLoading}
      />
    </div>
  )
}
