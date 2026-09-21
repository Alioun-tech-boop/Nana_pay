import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Skeleton,
  Tabs,
  Text,
  useToast,
} from '../../../design-system'
import type { IconName } from '../../../design-system'
import { notificationService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { formatDate } from '../../../lib/dates'
import { PageHeader } from '../../../components/client'
import type { Notification, NotificationType } from '../../../types'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../notifications.module.css'

type TabId = 'all' | 'unread' | 'read'

const TYPE_ICONS: Record<NotificationType, IconName> = {
  PAYMENT_CONFIRMED: 'check-circle',
  SAVINGS_UPDATED: 'coins',
  SAVINGS_EXTENDED: 'clock',
  CREDIT_APPROVED: 'check-circle',
  CREDIT_REFUSED: 'alert',
  QR_GENERATED: 'qr',
  WITHDRAWAL_CONFIRMED: 'check-circle',
  DELIVERY_CONFIRMED: 'truck',
  MERCHANT_PAID: 'money',
  ORDER_COMPLETED: 'check-circle',
  SYSTEM: 'info',
}

function notificationLink(notification: Notification): string | null {
  const data = notification.data
  if (!data) return null
  const orderId = typeof data.orderId === 'string' ? data.orderId : null
  const savingsId = typeof data.savingsId === 'string' ? data.savingsId : null
  if (notification.type === 'QR_GENERATED' && orderId) return `/orders/${orderId}/qr`
  if (orderId) return `/orders/${orderId}`
  if (savingsId) return `/savings/${savingsId}`
  return null
}

export function NotificationsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<TabId>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const notifications = useRequest(() => notificationService.getNotifications({ pageSize: 50 }), { deps: [] })

  const items = useMemo(() => notifications.data?.items ?? [], [notifications.data])
  const unreadCount = items.filter((item) => !item.read).length
  const visible = tab === 'all' ? items : items.filter((item) => (tab === 'unread' ? !item.read : item.read))

  async function markRead(notification: Notification) {
    if (notification.read || busyId) return
    setBusyId(notification.id)
    try {
      await notificationService.markAsRead(notification.id)
      await notifications.refresh()
    } catch (caught) {
      toast({ tone: 'danger', title: 'Action impossible', description: toUserMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  async function markAllRead() {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await notificationService.markAllAsRead()
      await notifications.refresh()
    } catch (caught) {
      toast({ tone: 'danger', title: 'Action impossible', description: toUserMessage(caught) })
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Notifications" />

      <div className={styles.headerRow}>
        <Tabs
          variant="segmented"
          value={tab}
          onChange={(value) => setTab(value as TabId)}
          items={[
            { id: 'all', label: 'Toutes', count: items.length },
            { id: 'unread', label: 'Non lues', count: unreadCount },
            { id: 'read', label: 'Lues', count: items.length - unreadCount },
          ]}
        />
        <Button variant="ghost" size="sm" loading={markingAll} disabled={unreadCount === 0} onClick={() => void markAllRead()}>
          Tout marquer comme lu
        </Button>
      </div>

      {notifications.isError ? (
        <ErrorState
          title="Notifications indisponibles"
          description={toUserMessage(notifications.error)}
          onRetry={() => void notifications.refresh()}
        />
      ) : notifications.isLoading ? (
        <section className={viewStyles.surface}>
          <Skeleton width={260} height={16} />
          <Skeleton width={300} height={16} />
          <Skeleton width={220} height={16} />
        </section>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="info"
          title={tab === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          description={
            <Text muted>
              Vous serez informé ici dès qu’un paiement, un financement ou un retrait est confirmé par NanoPay.
            </Text>
          }
        />
      ) : (
        <div className={styles.list}>
          {visible.map((notification) => {
            const link = notificationLink(notification)
            return (
              <article
                key={notification.id}
                className={`${styles.item} ${notification.read ? '' : styles.itemUnread}`}
              >
                <span className={styles.icon} aria-hidden="true">
                  <Icon name={TYPE_ICONS[notification.type]} size={18} />
                </span>
                <div className={styles.main}>
                  <div className={styles.titleRow}>
                    <span className={styles.title}>{notification.title}</span>
                    {!notification.read ? <Badge tone="info">Nouveau</Badge> : null}
                  </div>
                  {notification.body ? <p className={styles.body}>{notification.body}</p> : null}
                  <span className={styles.date}>{formatDate(notification.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className={styles.actions}>
                    {link ? (
                      <Link to={link}>
                        <Button variant="ghost" size="sm">Ouvrir</Button>
                      </Link>
                    ) : null}
                    {!notification.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === notification.id}
                        onClick={() => void markRead(notification)}
                      >
                        Marquer comme lu
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}