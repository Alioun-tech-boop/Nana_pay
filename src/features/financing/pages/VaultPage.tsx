import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Icon,
  InlineAlert,
  Input,
  Metric,
  MoneyAmount,
  ProgressBar,
  Section,
  Skeleton,
  StatusPill,
  Text,
} from '../../../design-system'
import { vaultService } from '../../../services'
import { useFreshIdempotencyKey, useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../financing.module.css'

const vaultHeroImage = '/assets/vault-hero.jpeg'

export function VaultPage() {
  const vault = useRequest(() => vaultService.getVault(), { deps: [] })
  const transactions = useRequest(() => vaultService.getTransactions({ pageSize: 25 }), { deps: [] })

  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [monthlyInput, setMonthlyInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [formError, setFormError] = useState('')
  const [planSaved, setPlanSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Clé d'idempotence liée aux valeurs soumises : modifier le plan génère une nouvelle clé,
  // tandis qu'un nouvel essai avec les mêmes valeurs reste idempotent.
  const idempotencyKey = useFreshIdempotencyKey(`${monthlyInput}:${targetInput}`)

  if (vault.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader title="Coffre NanoPay" />
        <ErrorState
          title="Coffre indisponible"
          description={toUserMessage(vault.error)}
          onRetry={() => void vault.refresh()}
        />
      </div>
    )
  }

  const data = vault.data
  const target = data?.targetAmount ?? null
  const monthly = data?.monthlyContribution ?? null
  const remainingToTarget = target && data ? Math.max(0, target.amount - data.balance.amount) : 0
  const progressPercent =
    target && data && target.amount > 0
      ? Math.min(100, Math.round((data.balance.amount / target.amount) * 100))
      : 0

  const monthlyValue = Number(monthlyInput)
  const targetValue = Number(targetInput)
  const monthlyValid = monthlyInput !== '' && Number.isInteger(monthlyValue) && monthlyValue > 0
  const targetValid = targetInput !== '' && Number.isInteger(targetValue) && targetValue > 0

  function startEditing() {
    setMonthlyInput(monthly ? String(monthly.amount) : '')
    setTargetInput(target ? String(target.amount) : '')
    setFormError('')
    setPlanSaved(false)
    setIsEditingPlan(true)
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!monthlyValid) {
      setFormError('Saisissez un prélèvement mensuel entier supérieur à zéro.')
      return
    }
    if (!targetValid) {
      setFormError('Saisissez une somme visée entière supérieure à zéro.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      await vaultService.configurePlan({
        monthlyAmount: monthlyValue,
        targetAmount: targetValue,
        idempotencyKey,
      })
      await vault.refresh()
      setIsEditingPlan(false)
      setPlanSaved(true)
    } catch (caught) {
      setFormError(toUserMessage(caught))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Coffre NanoPay" />

      {vault.isLoading || !data ? (
        <section className={viewStyles.surface}>
          <Skeleton width={160} height={20} />
          <Skeleton width={280} height={16} />
        </section>
      ) : (
        <>
          <section
            className={styles.hero}
            style={{ backgroundImage: `url(${vaultHeroImage})` }}
            aria-labelledby="vault-hero-title"
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <span className={`${styles.heroIcon} ${styles['heroIcon--cyan']}`} aria-hidden="true">
                <Icon name="vault" size={26} />
              </span>
              <div>
                <div className={styles.heroMeta}>
                  <StatusPill
                    tone={data.eligible ? 'success' : 'warning'}
                    label={data.eligible ? 'Coffre actif' : 'Non éligible'}
                  />
                  <span className={styles.heroReference}>{data.id}</span>
                </div>
                <h2 id="vault-hero-title" className={styles.heroTitle}>
                  <MoneyAmount amount={data.balance.amount} currency={data.balance.currency} variant="display" animate />
                </h2>
                <p className={styles.heroMeta}>Solde disponible du coffre</p>
                <div className={styles.heroActions}>
                  <Link to="/marketplace">
                    <Button leadingIcon={<Icon name="shop" size={16} />}>Financer une commande</Button>
                  </Link>
                  <Link to="/purchases">
                    <Button variant="secondary">Mes achats</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {!data.eligible ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="warning" title="Coffre non éligible">
                <Text muted>
                  L’usage du coffre est soumis à la validation de votre profil bancaire par votre employeur. Contactez
                  votre employeur ou votre banque pour activer le coffre.
                </Text>
              </InlineAlert>
            </div>
          ) : null}

          {planSaved ? (
            <div className={styles.alertStack}>
              <InlineAlert tone="success" title="Plan coffre enregistré">
                <Text muted>
                  Le prélèvement mensuel sera effectué sur votre salaire jusqu’à atteindre la somme visée. NanoPay
                  confirme les termes définitifs.
                </Text>
              </InlineAlert>
            </div>
          ) : null}

          <div className={styles.metricGrid}>
            <Metric
              label="Solde du coffre"
              icon="vault"
              value={<MoneyAmount amount={data.balance.amount} currency={data.balance.currency} />}
            />
            <Metric
              label="Prélèvement mensuel"
              icon="calendar"
              value={
                monthly ? (
                  <MoneyAmount amount={monthly.amount} currency={monthly.currency} />
                ) : (
                  '—'
                )
              }
            />
            <Metric label="Mouvements" icon="refresh" value={data.transactionsCount} />
          </div>

          <Section title="Mon plan coffre">
            {!data.eligible ? (
              <Text muted>
                Le plan coffre sera disponible après la validation de votre profil bancaire par votre employeur.
              </Text>
            ) : (
              <>
                {target ? (
                  <ProgressBar
                    value={progressPercent}
                    tone="gold"
                    label="Progression vers la somme visée"
                    showLabel
                  />
                ) : null}

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Prélèvement mensuel</span>
                    <span className={styles.infoValue}>
                      {monthly ? (
                        <MoneyAmount amount={monthly.amount} currency={monthly.currency} />
                      ) : (
                        'À définir'
                      )}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Somme visée</span>
                    <span className={styles.infoValue}>
                      {target ? (
                        <MoneyAmount amount={target.amount} currency={target.currency} />
                      ) : (
                        'À définir'
                      )}
                    </span>
                  </div>
                  {target ? (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Reste à atteindre</span>
                      <span className={styles.infoValue}>
                        <MoneyAmount amount={remainingToTarget} currency={target.currency} />
                      </span>
                    </div>
                  ) : null}
                </div>

                {!isEditingPlan ? (
                  <>
                    <Text muted>
                      {target && monthly
                        ? 'Un montant fixe est prélevé chaque mois sur votre salaire, jusqu’à atteindre la somme visée.'
                        : 'Définissez le montant prélevé chaque mois sur votre salaire et la somme que vous souhaitez atteindre.'}
                    </Text>
                    <div className={styles.nextStepActions}>
                      <Button variant="secondary" onClick={startEditing}>
                        {target && monthly ? 'Modifier mon plan' : 'Définir mon plan'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <form className={styles.contributionPanel} onSubmit={(event) => void savePlan(event)}>
                    <Input
                      label="Prélèvement mensuel (F CFA)"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="20 000"
                      value={monthlyInput}
                      onChange={(event) => setMonthlyInput(event.target.value.replace(/\D/g, '').slice(0, 9))}
                      disabled={isSaving}
                      hint="Montant prélevé chaque mois sur votre salaire."
                    />
                    <Input
                      label="Somme visée (F CFA)"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="500 000"
                      value={targetInput}
                      onChange={(event) => setTargetInput(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={isSaving}
                      hint="Objectif à atteindre pour utiliser le coffre."
                    />
                    {formError ? (
                      <InlineAlert tone="danger" title="Enregistrement impossible">
                        {formError}
                      </InlineAlert>
                    ) : null}
                    <div className={styles.nextStepActions}>
                      <Button
                        type="submit"
                        loading={isSaving}
                        disabled={!monthlyValid || !targetValid}
                      >
                        Enregistrer mon plan
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSaving}
                        onClick={() => setIsEditingPlan(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </Section>

          <Section title="Mouvements du coffre">
            {transactions.isLoading ? (
              <section className={viewStyles.surface}>
                <Skeleton width={220} height={16} />
                <Skeleton width={260} height={16} />
              </section>
            ) : (transactions.data?.items.length ?? 0) === 0 ? (
              <Text muted>Aucun mouvement pour le moment.</Text>
            ) : (
              <div className={styles.list}>
                {transactions.data?.items.map((entry) => {
                  const credit = entry.direction === 'CREDIT'
                  return (
                    <div key={entry.id} className={styles.item}>
                      <span className={styles.itemIcon} aria-hidden="true">
                        <Icon name={credit ? 'download' : 'upload'} size={18} />
                      </span>
                      <span className={styles.itemMain}>
                        <span className={styles.itemTitle}>
                          {credit ? 'Prélèvement salaire' : 'Financement de commande'}
                        </span>
                        <span className={styles.itemMuted}>
                          {formatDate(entry.createdAt)}
                          {entry.orderReference ? ` · ${entry.orderReference}` : ''}
                        </span>
                      </span>
                      <StatusPill tone={credit ? 'success' : 'neutral'} label={credit ? 'Crédit' : 'Débit'} />
                      <span className={styles.itemAmount}>
                        <MoneyAmount
                          amount={credit ? entry.amount.amount : -entry.amount.amount}
                          currency={entry.amount.currency}
                          signed
                        />
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
