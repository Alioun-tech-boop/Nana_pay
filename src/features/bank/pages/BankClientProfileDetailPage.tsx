import { Badge, ErrorState, Icon, MoneyAmount, Skeleton, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../bank.module.css'
import { useParams } from 'react-router-dom'

export function BankClientProfileDetailPage() {
  const { clientId = '' } = useParams()
  const detail = useRequest(() => bankService.getProfile(clientId), { deps: [clientId] })

  if (detail.isError) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Fiche client" />
        <ErrorState
          title="Impossible de charger le profil"
          description={toUserMessage(detail.error)}
          onRetry={() => void detail.refresh()}
        />
      </div>
    )
  }

  if (detail.isLoading || !detail.data) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Fiche client" />
        <div className={proStyles.panel}>
          <Skeleton width={220} height={20} />
          <Skeleton width={320} height={16} />
          <Skeleton width={260} height={16} />
        </div>
      </div>
    )
  }

  const data = detail.data

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title={data.fullName}
        meta={
          <Badge tone={data.riskLevel === 'HIGH' ? 'danger' : data.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
            Risque {data.riskLevel === 'HIGH' ? 'élevé' : data.riskLevel === 'MEDIUM' ? 'moyen' : 'faible'}
          </Badge>
        }
      />

      <div className={proStyles.twoCol}>
        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Situation financière</h2>
          <dl className={proStyles.definitionList}>
            <div className={proStyles.definition}>
              <dt>Employeur</dt>
              <dd>{data.employer ?? 'Non renseigné'}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Ancienneté</dt>
              <dd>{data.yearsAtWork === null ? 'Non renseignée' : `${data.yearsAtWork} ans`}</dd>
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
              <dt>Salaire vérifié</dt>
              <dd>{data.salaryVerified ? 'Oui' : 'Non'}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Profil bancaire validé</dt>
              <dd>{data.bankProfileValidated ? 'Oui' : 'Non'}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Total demandé</dt>
              <dd>
                <MoneyAmount amount={data.totalRequested.amount} currency={data.totalRequested.currency} variant="strong" />
              </dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Nombre de demandes</dt>
              <dd>{data.requestsCount}</dd>
            </div>
            <div className={proStyles.definition}>
              <dt>Encours actif</dt>
              <dd>
                {data.activeCreditAmount ? (
                  <MoneyAmount amount={data.activeCreditAmount.amount} currency={data.activeCreditAmount.currency} variant="strong" />
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Documents</h2>
          {data.documents.length === 0 ? (
            <Text muted>Aucun document.</Text>
          ) : (
            <div className={styles.docs}>
              {data.documents.map((document) => (
                <div key={document.id} className={styles.doc}>
                  <span style={{ display: 'inline-flex' }} aria-hidden="true">
                    <Icon name="doc" size={18} />
                  </span>
                  <div className={styles.docMain}>
                    <span className={styles.docTitle}>{document.label}</span>
                    <span className={styles.docMeta}>{formatDate(document.submittedAt)}</span>
                  </div>
                  <Badge tone={document.status === 'VERIFIED' ? 'success' : document.status === 'REJECTED' ? 'danger' : 'warning'}>
                    {document.status === 'VERIFIED' ? 'Vérifié' : document.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={proStyles.panel}>
        <h2 className={proStyles.panelTitle}>Demandes de crédit</h2>
        {data.requests.length === 0 ? (
          <Text muted>Aucune demande enregistrée.</Text>
        ) : (
          <div className={styles.queue}>
            {data.requests.map((request) => {
              const status = getStatusDefinition(request.status)
              return (
                <div key={request.id} className={styles.queueRow} style={{ cursor: 'default' }}>
                  <span className={proStyles.cellMain}>
                    <span className={proStyles.cellTitle}>{request.orderReference}</span>
                    <span className={proStyles.cellMeta}>{formatDate(request.createdAt)}</span>
                  </span>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.queueAmount}>
                    <MoneyAmount amount={request.requestedAmount.amount} currency={request.requestedAmount.currency} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}