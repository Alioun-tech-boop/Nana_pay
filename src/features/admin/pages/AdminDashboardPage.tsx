import { Link } from 'react-router-dom'
import { Button, Icon, Metric, Text } from '../../../design-system'
import { adminService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../admin.module.css'

export function AdminDashboardPage() {
  const summary = useRequest(() => adminService.getSummary(), { deps: [] })
  const audit = useRequest(() => adminService.getAudit({ pageSize: 5 }), { deps: [] })
  const auditRows = audit.data?.items ?? []

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title="Vue d’ensemble"
        actions={
          <>
            <Link to="/admin/audit">
              <Button variant="secondary" leadingIcon={<Icon name="eye" size={16} />}>
                Journal d’audit
              </Button>
            </Link>
            <Link to="/admin/kyc">
              <Button leadingIcon={<Icon name="shield" size={16} />}>Vérifications</Button>
            </Link>
          </>
        }
      />

      <div className={proStyles.statGrid}>
        <Metric
          label="Clients"
          value={summary.data ? String(summary.data.clients) : undefined}
          icon="user"
          loading={summary.isLoading}
        />
        <Metric
          label="Commerçants"
          value={summary.data ? String(summary.data.merchants) : undefined}
          icon="shop"
          loading={summary.isLoading}
        />
        <Metric
          label="Commandes actives"
          value={summary.data ? String(summary.data.activeOrders) : undefined}
          icon="box"
          loading={summary.isLoading}
        />
        <Metric
          label="Volume du mois"
          value={summary.data ? `${(summary.data.volumeThisMonth.amount / 100).toLocaleString('fr-FR')} XOF` : undefined}
          hint={summary.data ? 'Total toutes transactions' : undefined}
          icon="money"
          loading={summary.isLoading}
        />
      </div>

      <div className={proStyles.twoCol}>
        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>À surveiller</h2>
          {summary.isError ? (
            <Text muted>{toUserMessage(summary.error)}</Text>
          ) : (
            <dl className={proStyles.definitionList}>
              <div className={proStyles.definition}>
                <dt>Comptes enregistrés</dt>
                <dd>{summary.data?.users ?? '—'}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>KYC en attente</dt>
                <dd>{summary.data?.pendingKyc ?? '—'}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>Paiements à traiter</dt>
                <dd>{summary.data?.paymentsPending ?? '—'}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>Crédits à analyser</dt>
                <dd>{summary.data?.creditsToReview ?? '—'}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Dernières actions sensibles</h2>
          {audit.isLoading && <Text muted>Chargement du journal…</Text>}
          {audit.isError && <Text muted>{toUserMessage(audit.error)}</Text>}
          {!audit.isLoading && !audit.isError && auditRows.length === 0 && (
            <Text muted>Aucune entrée pour le moment.</Text>
          )}
          <div className={styles.auditList}>
            {auditRows.map((entry) => (
              <div key={entry.id} className={styles.auditRow}>
                <span className={styles.auditTime}>{formatDate(entry.at, { hour: '2-digit', minute: '2-digit' })}</span>
                <div className={styles.auditMain}>
                  <span className={styles.auditAction}>{entry.action}</span>
                  <span className={styles.auditMeta}>
                    {entry.scope} · {entry.targetId} · par {entry.actorId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}