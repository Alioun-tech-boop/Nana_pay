import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Button,
  ErrorState,
  Icon,
  InlineAlert,
  Input,
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

/** Montant minimum d'un versement d'épargne, en unités mineures. Règle backend. */
const MIN_PAYMENT = 1000

export function SavingsPage() {
  const { savingsId = '' } = useParams()
  const navigate = useNavigate()
  const [amountInput, setAmountInput] = useState('')

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
  const isOpen = statusKey === 'IN_PROGRESS' || statusKey === 'EXTENDED'
  const isReached = statusKey === 'REACHED'
  const isFailed = statusKey === 'FAILED' || statusKey === 'REFUNDED'
  const isSuspended = statusKey === 'SUSPENDED'
  const canPay = Boolean(data && isOpen && data.progressPercent < 100)

  const status = data ? getStatusDefinition(data.status) : null
  const remaining = data ? Math.max(0, data.targetAmount.amount - data.savedAmount.amount) : 0

  const payments = [...(history.data?.items ?? [])].reverse()
  const daysLeft = data ? daysBetween(todayISO(), data.deadline) : 0

  const amountValue = Number(amountInput)
  const amountError =
    amountInput === ''
      ? null
      : !Number.isInteger(amountValue) || amountValue <= 0
        ? 'Saisissez un montant entier.'
        : amountValue < MIN_PAYMENT
          ? `Le versement minimum est de ${MIN_PAYMENT.toLocaleString('fr-FR')} F CFA.`
          : amountValue > remaining
            ? `Le montant dépasse le reste à atteindre (${remaining.toLocaleString('fr-FR')} F CFA).`
            : null
  const amountValid = amountInput !== '' && amountError === null

  function goToPayment() {
    if (!data || !amountValid) return
    navigate(
      `/payment-mode?type=savings&savingsId=${data.id}&amount=${amountValue}&currency=${data.targetAmount.currency}`,
    )
  }

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
                {isOpen || isReached ? (
                  <Link to={`/orders/${data.orderId}`}>
                    <Button variant="secondary">Voir ma commande</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          {canPay ? (
            <Section title="Faire un versement">
              <div className={styles.contributionPanel}>
                <p className={styles.nextStepText}>
                  Versez librement le montant de votre choix, à tout moment, jusqu’à atteindre votre
                  objectif. Le montant minimum par versement est de 1 000 F CFA.
                </p>
                <Input
                  label="Montant du versement (F CFA)"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="5 000"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value.replace(/\D/g, '').slice(0, 9))}
                  error={amountError ?? undefined}
                  hint={`Reste à atteindre : ${remaining.toLocaleString('fr-FR')} F CFA.`}
                />
                <Button
                  size="lg"
                  disabled={!amountValid}
                  trailingIcon={<Icon name="arrow-right" size={18} />}
                  onClick={goToPayment}
                >
                  Continuer
                </Button>
              </div>
            </Section>
          ) : (
            <section className={styles.nextStep}>
              <span className={styles.nextStepIcon} aria-hidden="true">
                <Icon name="coins" size={22} />
              </span>
              <div className={styles.nextStepMain}>
                <h3 className={styles.nextStepTitle}>
                  {isReached ? 'Épargne complète' : isFailed ? 'Épargne non aboutie' : 'Statut de votre épargne'}
                </h3>
                {isReached ? (
                  <p className={styles.nextStepText}>
                    Votre épargne est complète. NanoPay a généré le QR de retrait à présenter au commerçant.
                  </p>
                ) : isFailed ? (
                  <p className={styles.nextStepText}>
                    Épargne non aboutie. La pénalité (15 %) et le remboursement (85 %) sont calculés et confirmés
                    par NanoPay.
                  </p>
                ) : isSuspended ? (
                  <p className={styles.nextStepText}>
                    Cette épargne est actuellement suspendue. Reportez-vous à NanoPay pour toute information.
                  </p>
                ) : (
                  <p className={styles.nextStepText}>Cette épargne n’accepte plus de versements.</p>
                )}
              </div>
              <div className={styles.nextStepActions}>
                {isReached ? (
                  <Link to={`/orders/${data.orderId}/qr`}>
                    <Button leadingIcon={<Icon name="qr" size={16} />}>Voir mon QR de retrait</Button>
                  </Link>
                ) : null}
              </div>
            </section>
          )}

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
              </ol>
            )}
          </Section>

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
