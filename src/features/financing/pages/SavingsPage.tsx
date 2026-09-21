import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Icon,
  InlineAlert,
  MoneyAmount,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { savingsService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { daysBetween, formatDate, todayISO } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'

export function SavingsPage() {
  const { savingsId = '' } = useParams()
  const navigate = useNavigate()

  const savings = useRequest(() => savingsService.getSavingsById(savingsId), { deps: [savingsId] })
  const history = useRequest(() => savingsService.getSavingsHistory(savingsId), {
    deps: [savingsId, savings.isSuccess],
    enabled: savings.isSuccess,
  })

  if (savings.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader title="Épargne progressive" />
        <ErrorState
          title="Épargne introuvable"
          description={toUserMessage(savings.error)}
          onRetry={() => void savings.refresh()}
        />
      </div>
    )
  }

  const data = savings.data
  const statusKey = data ? (data.status as string) : ''
  const isInProgress = statusKey === 'IN_PROGRESS'
  const isReached = statusKey === 'REACHED'
  const isFailed = statusKey === 'FAILED' || statusKey === 'REFUNDED'
  const isSuspended = statusKey === 'SUSPENDED'
  const canPay = Boolean(data && isInProgress && data.progressPercent < 100)

  const status = data ? getStatusDefinition(data.status) : null
  const remaining = data ? Math.max(0, data.targetAmount.amount - data.savedAmount.amount) : 0

  const payments = [...(history.data?.items ?? [])].reverse()
  const daysLeft = data ? daysBetween(todayISO(), data.deadline) : 0

  return (
    <div className={viewStyles.page}>
      <PageHeader
        backTo="/purchases"
        eyebrow={data ? data.orderReference : undefined}
        title="Épargne progressive"
      />

      {savings.isLoading || !data ? (
        <>
          <section className={viewStyles.surface}>
            <Skeleton width={220} height={24} />
            <Skeleton width={300} height={18} />
          </section>
          <section className={viewStyles.surface}>
            <Skeleton width={200} height={16} />
            <Skeleton width={260} height={16} />
          </section>
        </>
      ) : (
        <>
          <section className={styles.heroSavings}>
            <div className={styles.heroSavingsInner}>
              <p className={styles.heroSavingsEyebrow}>Construisez votre prochain achat</p>
              <p className={styles.heroSavingsLabel}>Objectif</p>
              <MoneyAmount
                variant="display"
                className={styles.heroSavingsAmountValue}
                amount={data.targetAmount.amount}
                currency={data.targetAmount.currency}
                animate
              />
              <div className={styles.heroSavingsProgress}>
                <span className={styles.heroSavingsPct}>{data.progressPercent} %</span>
                <span className={styles.heroSavingsRemaining}>
                  encore{' '}
                  <MoneyAmount amount={remaining} currency={data.targetAmount.currency} />
                  à épargner
                </span>
                <StatusPill tone={status?.tone ?? 'neutral'} label={status?.label ?? data.status} />
              </div>
              <div className={styles.heroSavingsActions}>
                {canPay ? (
                  <Button onClick={() => navigate('/payment-mode?type=savings&savingsId=' + data.id)}>
                    Effectuer le versement de {data.nextPaymentDue.amount.toLocaleString('fr-FR')} XOF
                  </Button>
                ) : null}
                {isInProgress || isReached ? (
                  <Link to={`/orders/${data.orderId}`}>
                    <Button variant="secondary">Voir ma commande</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <Section title="Historique des versements">
            {history.isLoading ? (
              <section className={viewStyles.surface}>
                <Skeleton width={200} height={16} />
                <Skeleton width={240} height={16} />
              </section>
            ) : payments.length === 0 ? (
              <Text muted>Aucun versement enregistré pour le moment. Votre premier versement apparaîtra ici après confirmation.</Text>
            ) : (
              <ol className={styles.timeline}>
                {payments.map((payment) => {
                  const paymentStatus = getStatusDefinition(payment.status)
                  const pending = payment.status === 'PENDING'
                  const label =
                    payment.status === 'PENDING' ? 'En attente de confirmation' : paymentStatus.label
                  return (
                    <li key={payment.id} className={styles.timelineItem}>
                      <span className={cxTimelineMarker(styles, pending)} aria-hidden="true" />
                      <span className={styles.timelineMain}>
                        <span className={styles.timelineAmount}>
                          <span className={styles.timelinePlus}>+</span>
                          <MoneyAmount amount={payment.amount.amount} currency={payment.amount.currency} />
                        </span>
                        <span className={styles.timelineDate}>{formatDate(payment.date)}</span>
                      </span>
                      <span className={styles.timelinePill}>
                        <StatusPill tone={paymentStatus.tone} label={label} />
                      </span>
                    </li>
                  )
                })}
                {isInProgress ? (
                  <li className={styles.timelineItem}>
                    <span className={styles.timelineNodeNext} aria-hidden="true" />
                    <span className={styles.timelineMain}>
                      <span className={styles.timelineAmount}>
                        <span className={styles.timelinePlus}>+</span>
                        <MoneyAmount amount={data.nextPaymentDue.amount} currency={data.nextPaymentDue.currency} />
                      </span>
                      <span className={styles.timelineDate}>Prochaine étape</span>
                    </span>
                  </li>
                ) : null}
              </ol>
            )}
          </Section>

          <section className={styles.nextStep}>
            <span className={styles.nextStepIcon} aria-hidden="true">
              <Icon name="coins" size={22} />
            </span>
            <div className={styles.nextStepMain}>
              <h3 className={styles.nextStepTitle}>Prochaine étape</h3>
              {isInProgress ? (
                <p className={styles.nextStepText}>
                  Effectuez le versement de{' '}
                  <MoneyAmount amount={data.nextPaymentDue.amount} currency={data.nextPaymentDue.currency} variant="strong" />{' '}
                  pour continuer vers votre objectif.
                </p>
              ) : isReached ? (
                <p className={styles.nextStepText}>
                  Votre épargne est complète. NanoPay a généré le QR de retrait à présenter au commerçant.
                </p>
              ) : isFailed ? (
                <p className={styles.nextStepText}>
                  Épargne non aboutie. La pénalité (15 %) et le remboursement (85 %) sont calculés et confirmés par NanoPay.
                </p>
              ) : isSuspended ? (
                <p className={styles.nextStepText}>Cette épargne est actuellement suspendue. Reportez-vous à NanoPay pour toute information.</p>
              ) : (
                <p className={styles.nextStepText}>Cette épargne n’accepte plus de versements.</p>
              )}
            </div>
            <div className={styles.nextStepActions}>
              {canPay ? (
                <Button onClick={() => navigate('/payment-mode?type=savings&savingsId=' + data.id)}>
                  Effectuer le versement de {data.nextPaymentDue.amount.toLocaleString('fr-FR')} XOF
                </Button>
              ) : null}
              {isReached ? (
                <Link to={`/orders/${data.orderId}/qr`}>
                  <Button leadingIcon={<Icon name="qr" size={16} />}>Voir mon QR de retrait</Button>
                </Link>
              ) : null}
              {canPay || isReached ? (
                <Link to={`/orders/${data.orderId}`}>
                  <Button variant="ghost">Voir la commande</Button>
                </Link>
              ) : null}
            </div>
          </section>

          {statusKey === 'FAILED' || statusKey === 'REFUNDED' ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="danger" title={statusKey === 'FAILED' ? 'Épargne non aboutie' : 'Épargne remboursée'}>
                <Text muted>
                  {statusKey === 'FAILED'
                    ? 'En cas d’échec, la règle applicable est de 15 % de pénalité et 85 % de remboursement. Les montants définitifs sont calculés et confirmés par NanoPay.'
                    : 'Votre remboursement a été confirmé par NanoPay. Les montants présentés proviennent du backend.'}
                </Text>
              </InlineAlert>
            </div>
          ) : null}

          {data.status === 'EXTENDED' ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="warning" title="Épargne prolongée">
                <Text muted>
                  Votre épargne a été prolongée. La durée maximale d’extension autorisée est confirmée par NanoPay.
                </Text>
              </InlineAlert>
            </div>
          ) : null}

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Démarrée le</span>
              <span className={styles.infoValue}>{formatDate(data.startedAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Échéance</span>
              <span className={styles.infoValue}>{formatDate(data.deadline)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Mois restants</span>
              <span className={styles.infoValue}>
                {data.remainingMonths > 0 ? `${data.remainingMonths} mois` : 'Terminée'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Jours restants</span>
              <span className={styles.infoValue}>
                {data.status === 'REACHED' ? '—' : `${daysLeft} jours`}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Prolongation possible</span>
              <span className={styles.infoValue}>{data.maxExtensionMonths} mois maximum</span>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

function cxTimelineMarker(styles: Record<string, string>, pending: boolean): string {
  return pending ? `${styles.timelineMarker} ${styles['timelineMarker--pending']}` : styles.timelineMarker
}