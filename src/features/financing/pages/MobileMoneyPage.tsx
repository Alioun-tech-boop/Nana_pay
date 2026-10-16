import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  Icon,
  InlineAlert,
  Input,
  MoneyAmount,
  Section,
} from '../../../design-system'
import type { MobileMoneyProvider, Payment } from '../../../types'
import { useIdempotencyKey } from '../../../hooks'
import { paymentService, savingsService } from '../../../services'
import { toUserMessage } from '../../../lib/errors'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../mobileMoney.module.css'

const OPERATORS: Array<{
  id: MobileMoneyProvider
  name: string
  detail: string
  accent: string
  mark: string
}> = [
  { id: 'ORANGE_MONEY', name: 'Orange Money', detail: 'Paiement rapide et sécurisé', accent: '#ff7900', mark: 'OM' },
  { id: 'MOOV_MONEY', name: 'Moov Money', detail: 'Simple, partout avec vous', accent: '#18a957', mark: 'M' },
  { id: 'WAVE', name: 'Wave', detail: 'Une expérience fluide', accent: '#168cff', mark: 'W' },
  { id: 'MTN_MONEY', name: 'MTN Mobile Money', detail: 'Votre compte mobile en confiance', accent: '#ffd100', mark: 'MTN' },
]

export function MobileMoneyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>('ORANGE_MONEY')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [savingsDone, setSavingsDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const idempotencyKey = useIdempotencyKey()
  const params = new URLSearchParams(location.search)

  const isSavingsPayment = params.get('type') === 'savings'
  const savingsId = params.get('savingsId') ?? ''
  const savingsAmount = Number(params.get('amount'))
  const savingsAmountValid = Number.isInteger(savingsAmount) && savingsAmount >= 1000
  const savingsCurrency = params.get('currency') ?? 'XOF'
  const methodPath = `/payment-mode${location.search}`

  async function submitPayment() {
    const normalizedPhone = phoneNumber.replace(/[\s()-]/g, '')
    if (!/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      setError('Saisissez un numéro Mobile Money valide.')
      return
    }
    if (isSavingsPayment && (!savingsId || !savingsAmountValid)) {
      setError('Le montant du versement est invalide. Revenez choisir un montant.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      if (isSavingsPayment) {
        await savingsService.makeSavingsPayment({
          savingsId,
          amount: savingsAmount,
          method: 'MOBILE_MONEY',
          idempotencyKey,
        })
        setSavingsDone(true)
      } else {
        const result = await paymentService.startMobileMoneyPayment({
          provider: selectedProvider,
          phoneNumber: normalizedPhone,
          orderId: params.get('orderId') ?? undefined,
          idempotencyKey,
        })
        setPayment(result)
      }
    } catch (caught) {
      setError(toUserMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOperator = OPERATORS.find((operator) => operator.id === selectedProvider) ?? OPERATORS[0]
  const isDone = Boolean(payment) || savingsDone

  return (
    <div className={`${viewStyles.page} ${styles.page}`}>
      <PageHeader
        backTo={methodPath}
        eyebrow={isSavingsPayment ? 'Épargne progressive' : 'Paiement sécurisé'}
        title={isSavingsPayment ? 'Verser avec Mobile Money' : 'Payer avec Mobile Money'}
      />

      <section className={styles.hero} aria-labelledby="mobile-money-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>Paiement instantané</span>
          <h2 id="mobile-money-title">Choisissez votre opérateur</h2>
          <p>Une expérience simple, sécurisée et confirmée par NanaPay.</p>
        </div>
        <div className={styles.heroSignal} aria-hidden="true">
          <Icon name="lock" size={20} />
          <span>Connexion chiffrée</span>
        </div>
      </section>

      {savingsDone ? (
        <InlineAlert
          tone="success"
          title="Versement transmis à NanaPay"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate(`/savings/${savingsId}`)}>
              Voir mon épargne
            </Button>
          }
        >
          Votre versement de{' '}
          <MoneyAmount amount={savingsAmount} currency={savingsCurrency} /> sera confirmé par NanaPay.
        </InlineAlert>
      ) : null}

      {payment ? (
        <InlineAlert tone="success" title="Paiement transmis à NanaPay">
          La confirmation finale dépend du retour de votre opérateur. Statut reçu : {payment.status}.
        </InlineAlert>
      ) : null}

      {error ? (
        <InlineAlert tone="danger" title={isSavingsPayment ? 'Versement impossible' : 'Paiement impossible'}>
          {error}
        </InlineAlert>
      ) : null}

      <Section title="Votre opérateur">
        <div className={styles.operatorGrid} role="radiogroup" aria-label="Choisir un opérateur Mobile Money">
          {OPERATORS.map((operator) => {
            const selected = operator.id === selectedProvider
            return (
              <button
                key={operator.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.operatorCard} ${selected ? styles.operatorCardSelected : ''}`}
                style={{ '--operator-accent': operator.accent } as CSSProperties}
                onClick={() => {
                  setSelectedProvider(operator.id)
                  setPayment(null)
                }}
              >
                <span className={styles.operatorMark}>{operator.mark}</span>
                <span className={styles.operatorContent}>
                  <strong>{operator.name}</strong>
                  <small>{operator.detail}</small>
                </span>
                <span className={styles.operatorCheck} aria-hidden="true">
                  <Icon name="check-circle" size={20} />
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      <section className={styles.formPanel} aria-labelledby="mobile-money-details">
        <div className={styles.formHeading}>
          <div>
            <span className={styles.formEyebrow}>Étape suivante</span>
            <h2 id="mobile-money-details">Vos coordonnées de paiement</h2>
          </div>
          <span className={styles.selectedProvider}>{selectedOperator.name}</span>
        </div>

        {isSavingsPayment && savingsAmountValid ? (
          <p className={styles.formRecap}>
            Montant du versement : <MoneyAmount amount={savingsAmount} currency={savingsCurrency} />
          </p>
        ) : null}

        <Input
          label="Numéro Mobile Money"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07 00 00 00 00"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          disabled={isSubmitting || isDone}
          hint="Le numéro sera transmis uniquement au partenaire de paiement."
          error={error && !isDone ? error : undefined}
        />
        <div className={styles.formFooter}>
          <p><Icon name="shield" size={16} /> Le montant et la confirmation sont déterminés par NanaPay.</p>
          <Button
            className={styles.submitButton}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isDone || (isSavingsPayment && !savingsAmountValid)}
            trailingIcon={<Icon name="arrow-right" size={18} />}
            onClick={() => void submitPayment()}
          >
            {savingsDone
              ? 'Versement en attente de confirmation'
              : payment
                ? 'Paiement en attente de confirmation'
                : isSavingsPayment
                  ? `Verser avec ${selectedOperator.name}`
                  : `Payer avec ${selectedOperator.name}`}
          </Button>
        </div>
      </section>

      <button type="button" className={styles.backAction} onClick={() => navigate(methodPath)}>
        Modifier le mode de paiement
      </button>
    </div>
  )
}
