import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Icon,
  InlineAlert,
  Input,
  MoneyAmount,
  RadioGroup,
  Select,
  StatusPill,
  Stepper,
  Text,
  useToast,
} from '../../../design-system'
import type { FinancingMode } from '../../../types'
import type { Order } from '../../../types'
import { orderService, savingsService, vaultService, creditService } from '../../../services'
import { useCart } from '../../../stores/cart'
import { toUserMessage } from '../../../lib/errors'
import { PageHeader, ProductTile } from '../../../components/client'
import { productVisual } from '../lib/visual'
import viewStyles from '../../../components/client/view.module.css'
import styles from './checkout.module.css'

type CheckoutStep = 'review' | 'financing' | 'done'

const MODE_OPTIONS: Array<{ value: FinancingMode; title: string; note: string }> = [
  {
    value: 'SAVINGS',
    title: 'Épargne progressive',
    note: 'Vous épargnez un montant mensuel jusqu’au prix du produit puis récupérez votre QR.',
  },
  {
    value: 'VAULT',
    title: 'Coffre NanoPay',
    note: 'Le coffre alimenté par votre employeur finance immédiatement la commande (selon éligibilité).',
  },
  {
    value: 'CREDIT',
    title: 'Crédit bancaire',
    note: 'Une demande est envoyée à la banque qui analyse votre profil de crédit.',
  },
]

function suggestedMonthly(amount: number): number {
  return Math.max(1500, Math.round(amount / 12 / 500) * 500)
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { lines, subtotal, clear } = useCart()

  const [step, setStep] = useState<CheckoutStep>(lines.length > 0 ? 'review' : 'financing')
  const [mode, setMode] = useState<FinancingMode>('SAVINGS')
  const [contribution, setContribution] = useState<Record<string, number>>({})
  const [termMonths, setTermMonths] = useState(12)

  const [orders, setOrders] = useState<Array<{ order: Order; quantity: number }>>([])
  const [savingsIds, setSavingsIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [working, setWorking] = useState(false)
  const [vaultConfirmOpen, setVaultConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = useMemo(
    () => orders.reduce((sum, { order }) => sum + order.product.price.amount, 0),
    [orders],
  )
  const totalCurrency = orders[0]?.order.product.price.currency ?? subtotal?.currency ?? 'XOF'

  async function createOrders() {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const created: Array<{ order: Order; quantity: number }> = []
      for (const line of lines) {
        const order = await orderService.createOrder({
          productId: line.product.id,
          financingMode: mode,
          quantity: line.quantity,
          idempotencyKey: `np-order-${line.product.id}`,
        })
        created.push({ order, quantity: line.quantity })
      }
      setOrders(created)
      clear()
      setStep('financing')
    } catch (caught) {
      setError(toUserMessage(caught))
    } finally {
      setCreating(false)
    }
  }

  async function financeOrders() {
    if (working) return
    setWorking(true)
    setError(null)
    try {
      if (mode === 'SAVINGS') {
        const started: string[] = []
        for (const { order } of orders) {
          const savings = await savingsService.startSavings({
            orderId: order.id,
            idempotencyKey: `np-start-sav-${order.id}`,
          })
          started.push(savings.id)
        }
        setSavingsIds(started)
        setStep('done')
        toast({
          tone: 'success',
          title: 'Épargne démarrée',
          description: started.length === 1 ? `Votre épargne est en cours.` : `${started.length} épargnes sont en cours.`,
        })
      } else if (mode === 'VAULT') {
        for (const { order } of orders) {
          await vaultService.useVault({ orderId: order.id, idempotencyKey: `np-vault-${order.id}` })
        }
        setStep('done')
        toast({ tone: 'success', title: 'Coffre utilisé', description: 'Vos commandes sont financées par le coffre NanoPay.' })
      } else {
        for (const { order } of orders) {
          await creditService.requestCredit({
            orderId: order.id,
            termMonths,
            idempotencyKey: `np-credit-${order.id}`,
          })
        }
        setStep('done')
        toast({ tone: 'success', title: 'Demande de crédit envoyée', description: 'La banque analyse votre demande.' })
      }
    } catch (caught) {
      setError(toUserMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  if (lines.length === 0 && orders.length === 0 && step !== 'done') {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/marketplace" title="Paiement" />
        <EmptyState
          icon="wallet"
          title="Aucune commande à financer"
          description={<Text muted>Ajoutez des produits au panier pour créer votre commande.</Text>}
          action={
            <Link to="/marketplace">
              <Button>Explorer le marketplace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const modeNote = MODE_OPTIONS.find((option) => option.value === mode)

  return (
    <div className={viewStyles.page}>
      <PageHeader
        backTo={step === 'review' ? '/cart' : undefined}
        title="Financement"
      />

      <Stepper
        steps={[
          { label: 'Commande', state: step === 'done' || step === 'financing' ? 'done' : 'current' },
          { label: 'Financement', state: step === 'done' ? 'done' : step === 'financing' ? 'current' : 'upcoming' },
          { label: 'Confirmation', state: step === 'done' ? 'current' : 'upcoming' },
        ]}
      />

      {error ? <InlineAlert tone="danger" title={error} /> : null}

      {step === 'review' ? (
        <div className={styles.layout}>
          <div className={styles.stage}>
            <h2 className={styles.blockTitle}>Vos articles</h2>
            <div className={styles.lines}>
              {lines.map((line) => (
                <div key={line.product.id} className={styles.line}>
                  <ProductTile icon={productVisual(line.product).icon} accent={productVisual(line.product).accent} size="sm" />
                  <span className={styles.lineName}>{line.product.name}</span>
                  <span className={styles.lineQty}>× {line.quantity}</span>
                  <MoneyAmount amount={line.product.price.amount * line.quantity} currency={line.product.price.currency} />
                </div>
              ))}
            </div>

            <h2 className={styles.blockTitle}>Mode de financement</h2>
            <div className={styles.modes}>
              <RadioGroup
                name="financing-mode"
                label="Choisissez un mode :"
                value={mode}
                onChange={(value) => setMode(value as FinancingMode)}
                options={MODE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: (
                    <span className={styles.modeLabel}>
                      <span>
                        <strong>{option.title}</strong>
                      </span>
                    </span>
                  ),
                }))}
              />
            </div>
          </div>

          <aside className={styles.summary}>
            <h3 className={styles.summaryTitle}>Récapitulatif</h3>
            <div className={styles.summaryRow}>
              <span>Articles</span>
              <span>{lines.length}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total</span>
              <MoneyAmount amount={subtotal?.amount ?? 0} currency={subtotal?.currency ?? 'XOF'} />
            </div>
            <div className={viewStyles.divider} />
            <p className={styles.summaryNote}>{modeNote?.title}</p>
            <Button size="lg" fullWidth loading={creating} onClick={() => void createOrders()}>
              Créer mes commandes
            </Button>
          </aside>
        </div>
      ) : step === 'financing' ? (
        <div className={styles.layout}>
          <div className={styles.stage}>
            <h2 className={styles.blockTitle}>Commandes créées</h2>
            <div className={styles.lines}>
              {orders.map(({ order }) => (
                <div key={order.id} className={styles.line}>
                  <ProductTile icon="receipt" accent="brand" size="sm" />
                  <span className={styles.lineName}>
                    {order.product.name}
                    <span className={styles.lineRef}>{order.reference}</span>
                  </span>
                  <StatusPill tone="neutral" label={order.status} />
                  <MoneyAmount amount={order.product.price.amount} currency={order.product.price.currency} />
                </div>
              ))}
            </div>

            {mode === 'SAVINGS' ? (
              <div className={styles.financePanel}>
                <h2 className={styles.blockTitle}>Montant mensuel suggéré</h2>
                <p className={styles.panelNote}>
                  Ajustez le versement mensuel de chaque épargne. La durée et l’échéance sont recalculées par NanoPay.
                </p>
                <div className={styles.contributions}>
                  {orders.map(({ order }) => {
                    const amount = order.product.price.amount
                    const value = contribution[order.id] ?? suggestedMonthly(amount)
                    return (
                      <div key={order.id} className={styles.contributionRow}>
                        <div className={styles.contributionInfo}>
                          <span className={styles.lineName}>{order.product.name}</span>
                          <span className={styles.lineRef}>
                            Cible <MoneyAmount amount={amount} currency={totalCurrency} noSymbol />
                          </span>
                        </div>
                        <Input
                          type="number"
                          aria-label={`Versement mensuel pour ${order.product.name}`}
                          value={value}
                          onChange={(event) => {
                            const next = Number.parseInt(event.target.value, 10)
                            setContribution((current) => ({
                              ...current,
                              [order.id]: Number.isFinite(next) && next > 0 ? next : 0,
                            }))
                          }}
                          name={order.id}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {mode === 'CREDIT' ? (
              <div className={styles.financePanel}>
                <h2 className={styles.blockTitle}>Durée du crédit</h2>
                <p className={styles.panelNote}>
                  La décision finale appartient à la banque. La durée demandée peut être ajustée lors de l’analyse.
                </p>
                <Select
                  label="Durée de remboursement"
                  value={String(termMonths)}
                  onChange={(event) => setTermMonths(Number.parseInt(event.target.value, 10))}
                >
                  {[6, 9, 12, 18, 24].map((months) => (
                    <option key={months} value={String(months)}>
                      {months} mois
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {mode === 'VAULT' ? (
              <InlineAlert tone="warning">
                <Text muted>
                  L’usage du coffre n’est possible que si votre profil bancaire a été validé par votre employeur.
                  Le solde du coffre doit couvrir le montant total.
                </Text>
              </InlineAlert>
            ) : null}
          </div>

          <aside className={styles.summary}>
            <h3 className={styles.summaryTitle}>{modeNote?.title}</h3>
            <div className={styles.summaryRow}>
              <span>Total à financer</span>
              <MoneyAmount amount={totalAmount} currency={totalCurrency} />
            </div>
            <div className={styles.summaryRow}>
              <span>Commandes</span>
              <span>{orders.length}</span>
            </div>
            <div className={viewStyles.divider} />
            {mode === 'SAVINGS' ? (
              <Button
                size="lg"
                fullWidth
                loading={working}
                onClick={() => void financeOrders()}
              >
                Démarrer mon épargne
              </Button>
            ) : mode === 'VAULT' ? (
              <>
                <Button size="lg" fullWidth onClick={() => setVaultConfirmOpen(true)}>
                  Utiliser le coffre
                </Button>
                <ConfirmDialog
                  open={vaultConfirmOpen}
                  onClose={() => setVaultConfirmOpen(false)}
                  onConfirm={() => void financeOrders()}
                  loading={working}
                  title="Confirmer le prélèvement"
                  confirmLabel="Confirmer le prélèvement"
                  body={
                    <Text muted>
                      {orders.length} commande{orders.length > 1 ? 's' : ''} pour un total de{' '}
                      <MoneyAmount amount={totalAmount} currency={totalCurrency} /> sera financée depuis votre
                      coffre NanoPay. Cette action est irréversible.
                    </Text>
                  }
                />
              </>
            ) : (
              <Button size="lg" fullWidth loading={working} onClick={() => void financeOrders()}>
                Demander le crédit
              </Button>
            )}
          </aside>
        </div>
      ) : (
        <div className={styles.done}>
          <span className={styles.doneIcon} aria-hidden="true">
            <Icon name="check-circle" size={30} />
          </span>
          <h2 className={styles.doneTitle}>
            {mode === 'SAVINGS'
              ? 'Votre épargne est en cours'
              : mode === 'VAULT'
                ? 'Coffre NanoPay utilisé'
                : 'Demande de crédit envoyée'}
          </h2>
          <p className={styles.doneNote}>
            {orders.length} commande{orders.length > 1 ? 's' : ''} pour un total de{' '}
            <MoneyAmount amount={totalAmount} currency={totalCurrency} /> est en cours de financement.
          </p>
          <div className={styles.doneActions}>
            {mode === 'SAVINGS' ? (
              <Button onClick={() => navigate(savingsIds[0] ? `/savings/${savingsIds[0]}` : '/purchases')}>
                Voir mon épargne
              </Button>
            ) : mode === 'VAULT' ? (
              <Button onClick={() => navigate('/vault')}>Voir mon coffre</Button>
            ) : (
              <Button onClick={() => navigate('/credit')}>Suivre mon crédit</Button>
            )}
            <Link to="/purchases">
              <Button variant="secondary">Mes achats</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}