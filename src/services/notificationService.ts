import { api } from '../api'
import type { Notification, NotificationSummary, Paginated } from '../types'

export interface NotificationsQuery {
  page?: number
  pageSize?: number
}

export const notificationService = {
  getNotifications(query: NotificationsQuery = {}): Promise<Paginated<Notification>> {
    return api.request<Paginated<Notification>>({
      method: 'GET',
      path: '/notifications',
      query: { page: query.page, pageSize: query.pageSize },
    })
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const result = await api.request<Notification>({
      method: 'POST',
      path: `/notifications/${notificationId}/read`,
    })
    api.invalidateCache('/notifications')
    return result
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const result = await api.request<{ updated: number }>({
      method: 'POST',
      path: '/notifications/read-all',
    })
    api.invalidateCache('/notifications')
    return result
  },

  getSummary(): Promise<NotificationSummary> {
    return api.request<NotificationSummary>({
      method: 'GET',
      path: '/notifications/summary',
      cache: { ttlMs: 15_000 },
    })
  },
}