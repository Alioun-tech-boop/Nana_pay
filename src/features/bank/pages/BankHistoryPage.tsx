import { MoneyAmount, Section, Skeleton, StatusPill, Text } from '../../../design-system'
import { bankService } from '../../../services'
import { useRequest } from '../../../hooks'
import { getStatusDefinition } from '../../../lib/status'
import { formatDate } from '../../../lib/dates'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../bank.module.css'
import { useMemo } from 'react'

export function BankHistoryPage() {
  const requests = useRequest(() => bankService.getCreditRequests({ pageSize: 100 }), { deps: [] })

  const recent = useMemo(() => {
    const items = [...(requests.data?.items ?? [])]
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return items.slice(0, 20)
  }, [requests.data])

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Historique" />

      <Section title="Activité des demandes">
        {requests.isLoading ? (
          <div className={proStyles.panel}>
            <Skeleton width={240} height={16} />
            <Skeleton width={280} height={16} />
          </div>
        ) : recent.length === 0 ? (
          <Text muted>Aucune activité enregistrée.</Text>
        ) : (
          <div className={styles.queue}>
            {recent.map((request) => {
              const status = getStatusDefinition(request.status)
              return (
                <div key={request.id} className={styles.queueRow} style={{ cursor: 'default' }}>
                  <span className={proStyles.cellMain}>
                    <span className={proStyles.cellTitle}>{request.clientFullName}</span>
                    <span className={proStyles.cellMeta}>
                      {request.orderReference} · {formatDate(request.createdAt, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                  <StatusPill tone={status.tone} label={status.label} />
                  <span className={styles.queueAmount}>
                    <MoneyAmount amount={request.requestedAmount.amount} currency={request.requestedAmount.currency} variant="strong" />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}