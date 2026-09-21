import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BottomSheet,
  Button,
  Icon,
  InlineAlert,
  MoneyAmount,
  NanaQuickAction,
  NanaQuickActions,
  Skeleton,
} from '../../../design-system'
import type { IconName, NanaQuickActionVariant } from '../../../design-system'
import { historyService, savingsService, vaultService } from '../../../services'
import { useRequest } from '../../../hooks'
import { formatDate } from '../../../lib/dates'
import type { HistoryEntry, HistoryKind, Money } from '../../../types'
import balanceHeroImage from '../../../assets/balance-hero.png'
import styles from '../dashboard.module.css'

const KIND_ICON: Record<HistoryKind, IconName> = {
  ORDER: 'receipt',
  SAVINGS: 'coins',
  VAULT: 'vault',
  WITHDRAWAL: 'download',
  CREDIT: 'bank',
}

const KIND_LABELS: Record<HistoryKind, string> = {
  ORDER: 'Commandes',
  SAVINGS: 'Épargne',
  VAULT: 'Coffre',
  WITHDRAWAL: 'Retraits',
  CREDIT: 'Crédit',
}

const KIND_COLORS: Record<HistoryKind, string> = {
  ORDER: '#8B5CF6',
  SAVINGS: '#34D399',
  VAULT: '#60A5FA',
  WITHDRAWAL: '#FBBF24',
  CREDIT: '#F87171',
}

const DONUT_SIZE = 220
const DONUT_STROKE = 18
const DONUT_GAP = 20

const QUICK_ACTIONS: Array<{ id: string; variant: NanaQuickActionVariant; to?: string }> = [
  { id: 'recharge', variant: 'recharge', to: '/payment-mode' },
  { id: 'send', variant: 'send', to: '/marketplace' },
  { id: 'withdraw', variant: 'withdraw', to: '/payment-mode' },
  { id: 'more', variant: 'more' },
]

const MORE_LINKS: Array<{ label: string; icon: IconName; to: string }> = [
  { label: 'Épargne progressive', icon: 'coins', to: '/savings' },
  { label: 'Crédit bancaire', icon: 'bank', to: '/credit' },
  { label: 'Historique', icon: 'clock', to: '/history' },
  { label: 'Notifications', icon: 'alert', to: '/notifications' },
  { label: 'Profil', icon: 'user', to: '/profile' },
]

function sumMoney(items: Array<Money | undefined | null>): Money | null {
  const present = items.filter((item): item is Money => item != null)
  if (present.length === 0) return null
  const first = present[0]
  if (!present.every((item) => item.currency === first.currency)) return null
  return { amount: present.reduce((sum, item) => sum + item.amount, 0), currency: first.currency }
}

function currencyOf(money: Money | undefined | null): string {
  return money?.currency ?? 'XOF'
}

function inSameMonth(dateISO: string): boolean {
  const date = new Date(dateISO)
  const now = new Date()
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

function startOfDayTimestamps(days: number): number[] {
  const starts: number[] = []
  const now = new Date()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - offset)
    starts.push(day.getTime())
  }
  return starts
}

function bucketize<T>(
  items: T[],
  dateOf: (item: T) => number,
  valueOf: (item: T) => number,
  days: number,
): number[] {
  const starts = startOfDayTimestamps(days)
  const buckets = new Array<number>(days).fill(0)

  for (const item of items) {
    const time = dateOf(item)
    if (Number.isNaN(time)) continue

    let index = -1
    for (let i = 0; i < days; i += 1) {
      if (time >= starts[i]) {
        index = i
      } else {
        break
      }
    }

    if (index < 0) continue
    buckets[index] += valueOf(item)
  }

  const points: number[] = []
  let acc = 0
  for (const bucket of buckets) {
    acc += bucket
    points.push(acc)
  }

  return points
}

function trendOf(points: number[]): { direction: 'up' | 'down' | 'neutral'; pct: number | null } {
  const first = points[0] ?? 0
  const last = points[points.length - 1] ?? 0
  const delta = last - first
  if (delta === 0) return { direction: 'neutral', pct: null }
  const base = Math.max(Math.abs(first), Math.abs(last))
  if (base === 0) return { direction: 'neutral', pct: null }
  return { direction: delta > 0 ? 'up' : 'down', pct: (delta / base) * 100 }
}

function formatTrendPct(pct: number): string {
  const formatted = Math.abs(pct).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  return `${pct >= 0 ? '+' : '-'}${formatted} %`
}

interface SpendSegment {
  kind: HistoryKind
  amount: number
}

function SpendDonut({ entries }: { entries: HistoryEntry[] }) {
  const grouped = useMemo(() => Object.keys(KIND_LABELS) as HistoryKind[], [])

  const segments: SpendSegment[] = useMemo(
    () =>
      grouped
        .map((kind) => ({
          kind,
          amount: entries.reduce((sum, entry) => (entry.kind === kind ? sum + entry.amount.amount : sum), 0),
        }))
        .filter((segment) => segment.amount > 0),
    [entries, grouped],
  )

  const total = entries.reduce((sum, entry) => sum + entry.amount.amount, 0)
  const currency = currencyOf(entries[0]?.amount)

  if (segments.length === 0 || total === 0) {
    return <p className={styles.chartEmpty}>Aucune dépense confirmée ce mois-ci.</p>
  }

  const radius = (DONUT_SIZE - DONUT_STROKE) / 2 - 1.5
  const circumference = 2 * Math.PI * radius
  let cursor = 0
  const arcs = segments.map((segment) => {
    const fraction = segment.amount / total
    const arc = {
      color: KIND_COLORS[segment.kind],
      visible: Math.max(fraction * circumference - DONUT_GAP, 0.6),
      offset: cursor,
    }
    cursor += fraction * circumference
    return arc
  })

  return (
    <div className={styles.donut}>
      <div className={styles.donutWrap}>
        <svg
          className={styles.donutSvg}
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          role="img"
          aria-label="Répartition des dépenses confirmées du mois par catégorie"
        >
          <circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={DONUT_STROKE}
          />
          {arcs.map((arc, index) => (
            <circle
              key={index}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={DONUT_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${arc.visible} ${circumference - arc.visible}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
              style={{ transition: 'stroke-dasharray var(--np-duration-slow) var(--np-ease-out)' }}
            />
          ))}
        </svg>
        <div className={styles.donutCenter} aria-hidden="true">
          <MoneyAmount variant="strong" className={styles.donutCenterValue} amount={total} currency={currency} />
          <span className={styles.donutCenterLabel}>dépenses confirmées</span>
        </div>
      </div>

      <ul className={styles.donutLegend}>
        {segments.map((segment) => (
          <li key={segment.kind} className={styles.donutRow}>
            <span className={styles.donutDot} style={{ background: KIND_COLORS[segment.kind] }} aria-hidden="true" />
            <span className={styles.donutRowLabel}>{KIND_LABELS[segment.kind]}</span>
            <MoneyAmount
              variant="inline"
              className={styles.donutRowAmount}
              amount={segment.amount}
              currency={currency}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

type OverviewWidgetProps = {
  label: string
  hint: string
  money: Money | null
  loading: boolean
  trend?: { direction: 'up' | 'down' | 'neutral'; pct: number | null }
}

function OverviewWidget({ label, hint, money, loading, trend }: OverviewWidgetProps) {
  let value: ReactNode

  if (loading) {
    value = <Skeleton width={92} height={22} />
  } else if (money) {
    value = (
      <MoneyAmount
        variant="strong"
        className={styles.widgetValue}
        amount={money.amount}
        currency={money.currency}
      />
    )
  } else {
    value = <span className={styles.widgetValue}>—</span>
  }

  return (
    <article className={styles.widget}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetLabel}>{label}</span>
        {trend && (
          <span
            className={`${styles.widgetTrend} ${
              trend.direction === 'up'
                ? styles.widgetTrendUp
                : trend.direction === 'down'
                  ? styles.widgetTrendDown
                  : styles.widgetTrendNeutral
            }`}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}{' '}
            {trend.pct !== null ? formatTrendPct(trend.pct) : '—'}
          </span>
        )}
      </div>
      {value}
      <span className={styles.widgetHint}>{hint}</span>
    </article>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const vaultReq = useRequest(() => vaultService.getVault(), { deps: [] })
  const savingsReq = useRequest(() => savingsService.getSavings({ pageSize: 50 }), { deps: [] })
  const historyReq = useRequest(() => historyService.getHistory({ pageSize: 100 }), { deps: [] })

  const vault = vaultReq.data
  const savingsItems = savingsReq.data?.items ?? []
  const historyItems = historyReq.data?.items ?? []

  const syncError = vaultReq.isError || savingsReq.isError || historyReq.isError

  const savingsTotal = sumMoney(savingsItems.map((item) => item.savedAmount))
  const savingsTarget = sumMoney(savingsItems.map((item) => item.targetAmount))
  const activeGoals = savingsItems.filter(
    (item) => item.status === 'IN_PROGRESS' || item.status === 'EXTENDED',
  )
  const patrimoine = sumMoney([vault?.balance, savingsTotal])

  const monthOutflow = useMemo(
    () => historyReq.data?.items.filter((entry) => entry.direction === 'OUT' && inSameMonth(entry.date)) ?? [],
    [historyReq.data],
  )

  const monthSpend = sumMoney(monthOutflow.map((entry) => entry.amount))

  const recentTransactions: HistoryEntry[] = historyItems.slice(0, 5)
  const activeGoalsHint =
    activeGoals.length > 0
      ? `${activeGoals.length} plan${activeGoals.length > 1 ? 's' : ''} actif${activeGoals.length > 1 ? 's' : ''}`
      : 'Aucun plan en cours'

  const patrimoineTrend = useMemo(() => {
    const points = bucketize(
      historyItems,
      (entry) => new Date(entry.date).getTime(),
      (entry) => (entry.direction === 'IN' ? entry.amount.amount : -entry.amount.amount),
      14,
    )
    return trendOf(points)
  }, [historyItems])

  const epargneTrend = useMemo(() => {
    const points = bucketize(
      savingsItems,
      (item) => new Date(item.startedAt).getTime(),
      (item) => item.savedAmount.amount,
      14,
    )
    return trendOf(points)
  }, [savingsItems])

  const objectifsTrend = useMemo(() => {
    const points = bucketize(
      savingsItems,
      (item) => new Date(item.startedAt).getTime(),
      (item) => item.targetAmount.amount,
      14,
    )
    return trendOf(points)
  }, [savingsItems])

  const budgetTrend = useMemo(() => {
    const points = bucketize(
      historyItems.filter((entry) => entry.direction === 'OUT'),
      (entry) => new Date(entry.date).getTime(),
      (entry) => entry.amount.amount,
      14,
    )
    return trendOf(points)
  }, [historyItems])

  return (
    <div className={styles.page}>
      {syncError ? (
        <InlineAlert tone="danger" title="Vos données n'ont pas pu être synchronisées">
          Impossible de récupérer l'état de vos finances pour le moment. Vérifiez votre connexion puis
          réessayez.
        </InlineAlert>
      ) : null}

      <section
        className={styles.balanceHero}
        aria-labelledby="dashboard-balance"
        style={{ backgroundImage: `url(${balanceHeroImage})` }}
      >
        <div className={styles.balance}>
          <p id="dashboard-balance" className={styles.balanceLabel}>
            Votre solde
          </p>
          {vaultReq.isLoading ? (
            <Skeleton width={248} height={54} />
          ) : vault ? (
            <MoneyAmount
              variant="display"
              className={styles.balanceValue}
              amount={vault.balance.amount}
              currency={vault.balance.currency}
              animate
            />
          ) : (
            <span className={styles.balanceValue}>—</span>
          )}
          <p className={styles.balanceCaption}>Coffre NanoPay · solde confirmé par NanoPay</p>
        </div>

        <Button
          className={styles.balanceHeroButton}
          size="md"
          leadingIcon={<Icon name="plus" size={16} />}
          onClick={() => navigate('/payment-mode')}
        >
          Ajouter de l'argent
        </Button>
      </section>

      <NanaQuickActions>
        {QUICK_ACTIONS.map((action) => (
          <NanaQuickAction
            key={action.id}
            variant={action.variant}
            onClick={() => (action.to ? navigate(action.to) : setMoreOpen(true))}
            aria-haspopup={action.to ? undefined : 'dialog'}
          />
        ))}
      </NanaQuickActions>

      <section className={styles.stat} aria-labelledby="dashboard-spend">
        <div className={styles.statHead}>
          <p id="dashboard-spend" className={styles.statLabel}>
            Dépenses ce mois-ci
          </p>
          {historyReq.isLoading ? (
            <Skeleton width={168} height={28} />
          ) : (
            <MoneyAmount
              variant="strong"
              className={styles.statValue}
              amount={monthSpend?.amount ?? 0}
              currency={currencyOf(monthSpend)}
            />
          )}
        </div>
        {historyReq.isLoading ? (
          <Skeleton width="100%" height={96} />
        ) : (
          <SpendDonut entries={monthOutflow} />
        )}
      </section>

      <section className={styles.recent} aria-labelledby="dashboard-recent">
        <div className={styles.sectionHead}>
          <h2 id="dashboard-recent" className={styles.sectionTitle}>
            Transactions récentes
          </h2>
          <Link to="/history" className={styles.sectionLink}>
            Tout voir
          </Link>
        </div>

        {historyReq.isLoading ? (
          <div className={styles.txList}>
            {[0, 1, 2].map((key) => (
              <div key={key} className={styles.tx}>
                <Skeleton width={40} height={40} />
                <Skeleton width="60%" height={14} />
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <p className={styles.emptyText}>
            Aucune transaction pour le moment. Vos opérations confirmées apparaîtront ici.
          </p>
        ) : (
          <ul className={styles.txList}>
            {recentTransactions.map((entry) => (
              <li key={entry.id} className={styles.tx}>
                <span className={styles.txIcon} aria-hidden="true">
                  <Icon name={KIND_ICON[entry.kind]} size={18} />
                </span>
                <span className={styles.txMain}>
                  <span className={styles.txTitle}>{entry.title}</span>
                  <span className={styles.txMeta}>
                    {formatDate(entry.date, { day: 'numeric', month: 'short', year: undefined })}
                  </span>
                </span>
                <MoneyAmount
                  className={styles.txAmount}
                  amount={entry.direction === 'IN' ? entry.amount.amount : -entry.amount.amount}
                  currency={entry.amount.currency}
                  signed
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.widgets} aria-labelledby="dashboard-overview">
        <h2 id="dashboard-overview" className={styles.widgetsTitle}>
          Vue d'ensemble
        </h2>
        <div className={styles.widgetGrid}>
          <OverviewWidget
            label="Patrimoine total"
            hint="Coffre + épargne"
            money={patrimoine}
            loading={vaultReq.isLoading || savingsReq.isLoading}
            trend={patrimoineTrend}
          />
          <OverviewWidget
            label="Épargne"
            hint={activeGoalsHint}
            money={savingsTotal}
            loading={savingsReq.isLoading}
            trend={epargneTrend}
          />
          <OverviewWidget
            label="Objectifs"
            hint={`${activeGoals.length} objectif${activeGoals.length > 1 ? 's' : ''}`}
            money={savingsTarget}
            loading={savingsReq.isLoading}
            trend={objectifsTrend}
          />
          <OverviewWidget
            label="Budget"
            hint="Dépenses confirmées"
            money={monthSpend}
            loading={historyReq.isLoading}
            trend={budgetTrend}
          />
        </div>
      </section>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Plus d'options">
        <div className={styles.sheetList}>
          {MORE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={styles.sheetLink}
              onClick={() => setMoreOpen(false)}
            >
              <span className={styles.sheetIcon} aria-hidden="true">
                <Icon name={link.icon} size={18} />
              </span>
              <span className={styles.sheetLabel}>{link.label}</span>
              <span className={styles.sheetChevron} aria-hidden="true">
                <Icon name="chevron-right" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
