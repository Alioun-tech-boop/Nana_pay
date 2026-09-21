import { useMemo, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  Icon,
  MoneyAmount,
  Section,
  Skeleton,
  Tabs,
  Text,
} from '../../../design-system'
import type { IconName } from '../../../design-system'
import { historyService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import type { HistoryKind } from '../../../types'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../history.module.css'

type TabId = 'all' | HistoryKind

const KIND_LABELS: Record<HistoryKind, string> = {
  ORDER: 'Commandes',
  SAVINGS: 'Épargne',
  VAULT: 'Coffre',
  WITHDRAWAL: 'Retraits',
  CREDIT: 'Crédit',
}

const KIND_ICONS: Record<HistoryKind, IconName> = {
  ORDER: 'receipt',
  SAVINGS: 'coins',
  VAULT: 'vault',
  WITHDRAWAL: 'upload',
  CREDIT: 'bank',
}

export function HistoryPage() {
  const [tab, setTab] = useState<TabId>('all')
  const history = useRequest(() => historyService.getHistory({ pageSize: 100 }), { deps: [] })

  const items = useMemo(() => history.data?.items ?? [], [history.data])
  const counts = useMemo(() => {
    const base: Record<HistoryKind, number> = { ORDER: 0, SAVINGS: 0, VAULT: 0, WITHDRAWAL: 0, CREDIT: 0 }
    for (const entry of items) base[entry.kind] += 1
    return base
  }, [items])

  const visible = tab === 'all' ? items : items.filter((entry) => entry.kind === tab)

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Historique" />

      <div className={styles.tabsRow}>
        <Tabs
          variant="pills"
          value={tab}
          onChange={(value) => setTab(value as TabId)}
          items={[
            { id: 'all', label: 'Tout', count: items.length },
            { id: 'ORDER', label: KIND_LABELS.ORDER, count: counts.ORDER },
            { id: 'SAVINGS', label: KIND_LABELS.SAVINGS, count: counts.SAVINGS },
            { id: 'VAULT', label: KIND_LABELS.VAULT, count: counts.VAULT },
            { id: 'WITHDRAWAL', label: KIND_LABELS.WITHDRAWAL, count: counts.WITHDRAWAL },
            { id: 'CREDIT', label: KIND_LABELS.CREDIT, count: counts.CREDIT },
          ]}
        />
      </div>

      <Section title="Opérations">
        {history.isError ? (
          <ErrorState
            title="Historique indisponible"
            description={toUserMessage(history.error)}
            onRetry={() => void history.refresh()}
          />
        ) : history.isLoading ? (
          <section className={viewStyles.surface}>
            <Skeleton width={240} height={16} />
            <Skeleton width={280} height={16} />
            <Skeleton width={200} height={16} />
          </section>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="clock"
            title="Aucune opération"
            description={<Text muted>Les opérations apparaîtront ici dès qu’elles seront enregistrées par NanoPay.</Text>}
          />
        ) : (
          <div className={styles.list}>
            {visible.map((entry) => {
              const incoming = entry.direction === 'IN'
              return (
                <div key={entry.id} className={styles.row}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon name={KIND_ICONS[entry.kind]} size={18} />
                  </span>
                  <span className={styles.main}>
                    <span className={styles.title}>{entry.title}</span>
                    <span className={styles.meta}>
                      {formatDate(entry.date)}
                      {entry.reference ? ` · ${entry.reference}` : ''} · {incoming ? 'Entrée' : 'Sortie'}
                    </span>
                  </span>
                  <span className={`${styles.amount} ${incoming ? styles.amountIn : styles.amountOut}`}>
                    <MoneyAmount
                      amount={incoming ? entry.amount.amount : -entry.amount.amount}
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
    </div>
  )
}