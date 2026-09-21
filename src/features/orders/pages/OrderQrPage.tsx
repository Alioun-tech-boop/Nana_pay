import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  InlineAlert,
  MoneyAmount,
  QRCode,
  Skeleton,
  Spinner,
  StatusPill,
  Text,
  Timeline,
} from '../../../design-system'
import type { TimelineItemData } from '../../../design-system'
import { orderService, qrService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import { isQrAvailable } from '../lib/order'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../orders.module.css'

const QR_STATE_LABELS: Record<string, { tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; label: string }> = {
  VALID: { tone: 'info', label: 'QR valide' },
  SCANNED: { tone: 'info', label: 'QR scanné' },
  WITHDRAWN: { tone: 'success', label: 'Retrait confirmé' },
  SETTLED: { tone: 'success', label: 'Règlement effectué' },
  EXPIRED: { tone: 'danger', label: 'QR expiré' },
}

export function OrderQrPage() {
  const { orderId = '' } = useParams()
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const order = useRequest(() => orderService.getOrder(orderId), { deps: [orderId] })
  const qr = useRequest(() => qrService.getQr(orderId), { deps: [orderId] })
  const qrStatus = useRequest(() => qrService.getQrStatus(orderId), {
    deps: [orderId, qr.isSuccess],
    enabled: qr.isSuccess,
  })

  useEffect(() => {
    if (qrStatus.data?.state !== 'VALID') return
    const timer = window.setInterval(() => {
      void qrStatus.refresh()
    }, 8000)
    return () => window.clearInterval(timer)
  }, [qrStatus.data?.state, qrStatus.refresh])

  async function regenerate() {
    if (regenerating) return
    setRegenerating(true)
    try {
      await qrService.generateQr(orderId)
      setRegenerateOpen(false)
      await Promise.all([qr.refresh(), qrStatus.refresh()])
    } finally {
      setRegenerating(false)
    }
  }

  if (order.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/purchases" title="QR de retrait" />
        <ErrorState
          title="Commande introuvable"
          description={toUserMessage(order.error)}
          onRetry={() => void order.refresh()}
        />
      </div>
    )
  }

  const data = order.data
  const state = qrStatus.data?.state ?? qr.data?.state ?? 'VALID'
  const stateMeta = QR_STATE_LABELS[state] ?? QR_STATE_LABELS.VALID

  const steps: TimelineItemData[] = [
    { title: 'QR généré par NanoPay', state: qr.isSuccess ? 'done' : 'active' },
    { title: 'Le commerçant scanne le QR', state: state === 'VALID' ? 'active' : 'done' },
    {
      title: 'Retrait confirmé par le serveur',
      state: state === 'WITHDRAWN' || state === 'SETTLED' ? 'done' : 'upcoming',
    },
    {
      title: 'Règlement du commerçant',
      state: state === 'SETTLED' ? 'done' : 'upcoming',
    },
  ]

  return (
    <div className={viewStyles.page}>
      <PageHeader
        backTo={data ? `/orders/${data.id}` : '/purchases'}
        title="QR de retrait"
      />

      {order.isLoading || !data ? (
        <section className={viewStyles.surface}>
          <Skeleton width={220} height={20} />
          <Skeleton width={280} height={16} />
        </section>
      ) : !isQrAvailable(data) ? (
        <InlineAlert tone="info" title="QR pas encore disponible">
          <Text muted>
            Le QR de retrait sera généré par NanoPay lorsque le financement de la commande {data.reference} sera
            finalisé.
          </Text>
        </InlineAlert>
      ) : (
        <div className={styles.qrLayout}>
          <div className={styles.qrCard}>
            <StatusPill tone={stateMeta.tone} label={stateMeta.label} pulse={state === 'VALID'} />

            {qr.isLoading ? (
              <div className={styles.qrPlaceholder}>
                <Spinner />
                <Text muted>Préparation du QR…</Text>
              </div>
            ) : qr.isError ? (
              <div className={styles.qrPlaceholder}>
                <Icon name="qr" size={28} />
                <Text muted>
                  Le QR n’est pas disponible pour le moment. NanoPay le génère dès que la commande est prête.
                </Text>
                <Button loading={regenerating} onClick={() => setRegenerateOpen(true)}>
                  Générer le QR
                </Button>
              </div>
            ) : state === 'VALID' && qr.data ? (
              <div className={styles.qrFrame}>
                <QRCode
                  value={qr.data.payload}
                  size={216}
                  label="QR de retrait NanoPay"
                  description={`QR de retrait de la commande ${data.reference}`}
                />
              </div>
            ) : (
              <div className={styles.qrPlaceholder}>
                <Icon name={state === 'EXPIRED' ? 'alert' : 'check-circle'} size={28} />
                <Text muted>
                  {state === 'SCANNED'
                    ? 'QR scanné par le commerçant. Le retrait est en cours de validation.'
                    : state === 'EXPIRED'
                      ? 'Ce QR a expiré et n’est plus valide.'
                      : 'Le retrait a été confirmé par NanoPay.'}
                </Text>
                {state === 'EXPIRED' ? (
                  <Button loading={regenerating} onClick={() => setRegenerateOpen(true)}>
                    Générer un nouveau QR
                  </Button>
                ) : null}
              </div>
            )}

            <div>
              <p className={styles.qrMuted}>{data.product.name}</p>
              <p className={styles.qrRef}>{data.reference}</p>
            </div>
            <MoneyAmount amount={data.product.price.amount} currency={data.product.price.currency} variant="strong" />
            <Text muted>
              {qr.data?.expiresAt ? `Valide jusqu’au ${formatDate(qr.data.expiresAt, { hour: '2-digit', minute: '2-digit' })}` : ' '}
            </Text>
          </div>

          <div>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Ce qui se passe ensuite</h2>
              <Timeline items={steps} />
            </section>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => void qrStatus.refresh()}>
                Actualiser le statut
              </Button>
              <Link to={`/orders/${data.id}`}>
                <Button variant="ghost">Voir la commande</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        onConfirm={() => void regenerate()}
        loading={regenerating}
        title="Générer un nouveau QR"
        confirmLabel="Générer le QR"
        body={
          <Text muted>
            Le QR précédent deviendra invalide. Un nouveau QR sera généré pour la commande {data?.reference ?? ''}.
          </Text>
        }
      />
    </div>
  )
}