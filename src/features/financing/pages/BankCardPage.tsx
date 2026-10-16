import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  Icon,
  InlineAlert,
  Input,
  MoneyAmount,
  Section,
} from '../../../design-system'
import type { Payment } from '../../../types'
import { useIdempotencyKey } from '../../../hooks'
import { paymentService, savingsService } from '../../../services'
import { toUserMessage } from '../../../lib/errors'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../bankCard.module.css'

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

export function BankCardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [lastFour, setLastFour] = useState('••••')
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
    const digits = cardNumber.replace(/\s/g, '')
    if (digits.length < 12 || !cardholderName.trim() || !/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{2}$/.test(expiryYear) || !/^\d{3,4}$/.test(cvv)) {
      setError('Vérifiez les informations de votre carte.')
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
          method: 'CARD',
          idempotencyKey,
        })
        setLastFour(digits.slice(-4))
        setCardNumber('')
        setCvv('')
        setSavingsDone(true)
      } else {
        const result = await paymentService.startCardPayment({
          cardNumber: digits,
          expiryMonth,
          expiryYear,
          cvv,
          cardholderName: cardholderName.trim(),
          orderId: params.get('orderId') ?? undefined,
          idempotencyKey,
        })
        setLastFour(digits.slice(-4))
        setCardNumber('')
        setCvv('')
        setPayment(result)
      }
    } catch (caught) {
      setError(toUserMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDone = Boolean(payment) || savingsDone

  return (
    <div className={`${viewStyles.page} ${styles.page}`}>
      <PageHeader
        backTo={methodPath}
        eyebrow={isSavingsPayment ? 'Épargne progressive' : 'Paiement sécurisé'}
        title={isSavingsPayment ? 'Verser par carte bancaire' : 'Payer par carte bancaire'}
      />

      <section className={styles.hero} aria-labelledby="card-payment-title">
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>Paiement international</span>
          <h2 id="card-payment-title">Votre carte, en toute confiance.</h2>
          <p>Un parcours clair et sécurisé, avec confirmation finale par NanaPay.</p>
        </div>
        <div className={styles.heroSignal}>
          <Icon name="lock" size={18} />
          <span>3D Secure prêt</span>
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
          La confirmation finale dépend du partenaire bancaire. Statut reçu : {payment.status}.
        </InlineAlert>
      ) : null}

      {error ? (
        <InlineAlert tone="danger" title={isSavingsPayment ? 'Versement impossible' : 'Paiement impossible'}>
          {error}
        </InlineAlert>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.cardPreview} aria-label="Aperçu de la carte">
          <div className={styles.cardTopline}>
            <span>NanaPay</span>
            <Icon name="card" size={24} />
          </div>
          <div className={styles.cardChip} aria-hidden="true" />
          <p className={styles.cardDigits}>{lastFour === '••••' ? '•••• •••• •••• ••••' : `•••• •••• •••• ${lastFour}`}</p>
          <div className={styles.cardBottomline}>
            <span>{cardholderName || 'VOTRE NOM'}</span>
            <span>{expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : 'MM/AA'}</span>
          </div>
        </section>

        <section className={styles.formPanel} aria-labelledby="card-details-title">
          <Section title="Informations de carte">
            {isSavingsPayment && savingsAmountValid ? (
              <p className={styles.formRecap}>
                Montant du versement : <MoneyAmount amount={savingsAmount} currency={savingsCurrency} />
              </p>
            ) : null}
            <div className={styles.fields}>
              <Input
                label="Numéro de carte"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                disabled={isSubmitting || isDone}
                error={error && !isDone ? error : undefined}
              />
              <Input
                label="Nom sur la carte"
                autoComplete="cc-name"
                placeholder="Aminata Kone"
                value={cardholderName}
                onChange={(event) => setCardholderName(event.target.value.toUpperCase())}
                disabled={isSubmitting || isDone}
              />
              <div className={styles.compactFields}>
                <Input
                  label="Mois"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  placeholder="MM"
                  maxLength={2}
                  value={expiryMonth}
                  onChange={(event) => setExpiryMonth(event.target.value.replace(/\D/g, '').slice(0, 2))}
                  disabled={isSubmitting || isDone}
                />
                <Input
                  label="Année"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  placeholder="AA"
                  maxLength={2}
                  value={expiryYear}
                  onChange={(event) => setExpiryYear(event.target.value.replace(/\D/g, '').slice(0, 2))}
                  disabled={isSubmitting || isDone}
                />
                <Input
                  label="CVV"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="•••"
                  maxLength={4}
                  value={cvv}
                  onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  disabled={isSubmitting || isDone}
                />
              </div>
            </div>
          </Section>
          <div className={styles.formFooter}>
            <p><Icon name="shield" size={16} /> Les données sensibles sont transmises uniquement au flux de paiement.</p>
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
                    ? 'Verser en toute sécurité'
                    : 'Payer en toute sécurité'}
            </Button>
          </div>
        </section>
      </div>

      <button type="button" className={styles.backAction} onClick={() => navigate(methodPath)}>
        Modifier le mode de paiement
      </button>
    </div>
  )
}
