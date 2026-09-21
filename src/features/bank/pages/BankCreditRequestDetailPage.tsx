import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  Textarea,
} from '../../../design-system'
import { bankService } from '../../../services'
import { useMutation, useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../bank.module.css'

type DecisionKind = 'APPROVED' | 'REFUSED'

function documentTone(status: string) {
  if (status === 'VERIFIED') return 'success' as const
  if (status === 'REJECTED') return 'danger' as const
  return 'warning' as const
}

function documentLabel(status: string) {
  if (status === 'VERIFIED') return 'Vérifié'
  if (status === 'REJECTED') return 'Rejeté'
  return 'En attente'
}

export function BankCreditRequestDetailPage() {
  const { requestId = '' } = useParams()
  const [decision, setDecision] = useState<DecisionKind | null>(null)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const detail = useRequest(() => bankService.getCreditRequest(requestId), { deps: [requestId] })

  const decide = useMutation(
    (kind: DecisionKind) =>
      bankService.decideCreditRequest(requestId, {
        decision: kind,
        reason: reason.trim(),
        idempotencyKey: crypto.randomUUID(),
      }),
    {
      onSuccess: () => {
        setDecision(null)
        setReason('')
        setFeedback(
          decision === 'APPROVED'
            ? 'La demande a été acceptée. Le déblocage est géré par le backend.'
            : 'La demande a été refusée.',
        )
        void detail.refresh()
      },
    },
  )

  if (detail.isError) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Dossier de crédit" />
        <ErrorState
          title="Impossible de charger le dossier"
          description={toUserMessage(detail.error)}
          onRetry={() => void detail.refresh()}
        />
      </div>
    )
  }

  if (detail.isLoading || !detail.data) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Dossier de crédit" />
        <div className={proStyles.panel}>
          <Skeleton width={220} height={20} />
          <Skeleton width={320} height={16} />
          <Skeleton width={260} height={16} />
        </div>
      </div>
    )
  }

  const data = detail.data
  const status = getStatusDefinition(data.status)
  const inReview = data.status === 'IN_REVIEW'

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title={data.clientFullName}
        meta={<StatusPill tone={status.tone} label={status.label} />}
        actions={
          inReview ? (
            <div className={proStyles.actions}>
              <Button
                variant="danger"
                leadingIcon={<Icon name="close" size={16} />}
                onClick={() => {
                  setReason('')
                  setDecision('REFUSED')
                }}
              >
                Refuser
              </Button>
              <Button
                leadingIcon={<Icon name="check" size={16} />}
                onClick={() => {
                  setReason('')
                  setDecision('APPROVED')
                }}
              >
                Accepter
              </Button>
            </div>
          ) : (
            <Badge tone={data.status === 'APPROVED' ? 'success' : 'neutral'}>
              {data.status === 'APPROVED' ? 'Décision rendue' : 'Dossier clos'}
            </Badge>
          )
        }
      />

      {feedback ? (
        <InlineAlert tone="success" title={feedback} />
      ) : null}
      {decide.isError ? <InlineAlert tone="danger" title={toUserMessage(decide.error)} /> : null}

      {inReview && data.decisionReason ? (
        <InlineAlert tone="warning" title="Motif enregistré">
          {data.decisionReason}
        </InlineAlert>
      ) : null}

      <div className={proStyles.twoCol}>
        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Demande</h2>
          <dl className={proStyles.definitionList}>
            <div className={proStyles.definition}>
              <dt>Montant demandé</dt>
              <dd>
                <MoneyAmount amount={data.requestedAmount.amount} currency={data.requestedAmount.currency} variant="strong" />
              </dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Durée</dt>
              <dd>{data.termMonths} mois</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Commande</dt>
              <dd>{data.orderReference}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Salaire mensuel</dt>
              <dd>
                {data.monthlySalary ? (
                  <MoneyAmount amount={data.monthlySalary.amount} currency={data.monthlySalary.currency} />
                ) : (
                  'Non renseigné'
                )}
              </dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Ancienneté</dt>
              <dd>{data.yearsAtWork === null ? 'Non renseignée' : `${data.yearsAtWork} ans`}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Salaire vérifié</dt>
              <dd>{data.salaryVerified ? 'Oui' : 'Non'}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Profil bancaire validé</dt>
              <dd>{data.bankProfileValidated ? 'Oui' : 'Non'}</dd>
            </div>
          </dl>
        </section>

        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Client</h2>
          <dl className={proStyles.definitionList}>
            <div className={proStyles.definition}>
              <dt>Nom complet</dt>
              <dd>{data.clientFullName}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Email</dt>
              <dd>{data.email}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Téléphone</dt>
              <dd>{data.phone}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Ville</dt>
              <dd>{data.city}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Employeur</dt>
              <dd>{data.employer ?? 'Non renseigné'}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Niveau de risque</dt>
              <dd>
                <Badge tone={data.riskLevel === 'HIGH' ? 'danger' : data.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                  {data.riskLevel === 'HIGH' ? 'Élevé' : data.riskLevel === 'MEDIUM' ? 'Moyen' : 'Faible'}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className={proStyles.actions} style={{ marginTop: 'var(--np-space-4)' }}>
            <Link to={`/bank/profiles/${data.clientId}`} className={proStyles.actions}>
              <Button variant="secondary" size="sm">
                Voir le profil complet
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <section className={proStyles.panel}>
        <h2 className={proStyles.panelTitle}>Documents</h2>
        {data.documents.length === 0 ? (
          <Text muted>Aucun document transmis pour le moment.</Text>
        ) : (
          <div className={styles.docs}>
            {data.documents.map((document) => (
              <div key={document.id} className={styles.doc}>
                <span style={{ display: 'inline-flex' }} aria-hidden="true">
                  <Icon name="doc" size={18} />
                </span>
                <div className={styles.docMain}>
                  <span className={styles.docTitle}>{document.label}</span>
                  <span className={styles.docMeta}>
                    {document.type} · {formatDate(document.submittedAt)}
                  </span>
                </div>
                <Badge tone={documentTone(document.status)}>{documentLabel(document.status)}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={proStyles.panel}>
        <h2 className={proStyles.panelTitle}>Historique des demandes</h2>
        {data.history.length === 0 ? (
          <Text muted>Aucune demande précédente.</Text>
        ) : (
          <div className={styles.queue}>
            {data.history.map((request) => {
              const requestStatus = getStatusDefinition(request.status)
              return (
                <div key={request.id} className={styles.queueRow} style={{ cursor: 'default' }}>
                  <span className={proStyles.cellMain}>
                    <span className={proStyles.cellTitle}>{request.orderReference}</span>
                    <span className={proStyles.cellMeta}>
                      {formatDate(request.createdAt)}
                      {request.decisionReason ? ` · ${request.decisionReason}` : ''}
                    </span>
                  </span>
                  <StatusPill tone={requestStatus.tone} label={requestStatus.label} />
                  <span className={styles.queueAmount}>
                    <MoneyAmount amount={request.requestedAmount.amount} currency={request.requestedAmount.currency} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Text muted>
        La décision de crédit est enregistrée par le backend. Le frontend ne modifie ni montant, ni taux, ni
        éligibilité.
      </Text>

      <ConfirmDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        onConfirm={() => {
          if (decision) void decide.mutate(decision)
        }}
        title={decision === 'APPROVED' ? 'Accepter la demande de crédit' : 'Refuser la demande de crédit'}
        body={
          <div className={styles.docMain}>
            <p>
              Commande {data.orderReference} · {data.clientFullName}
            </p>
            <p>
              Montant demandé :{' '}
              <MoneyAmount amount={data.requestedAmount.amount} currency={data.requestedAmount.currency} variant="strong" />
            </p>
            <Textarea
              label="Motif de la décision"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder={decision === 'REFUSED' ? 'Indiquez le motif du refus…' : 'Justification de l’accord…'}
            />
          </div>
        }
        confirmLabel={decision === 'APPROVED' ? 'Accepter' : 'Refuser'}
        confirmTone={decision === 'REFUSED' ? 'danger' : 'primary'}
        loading={decide.isLoading}
      />
    </div>
  )
}