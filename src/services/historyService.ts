import { api } from '../api'
import type { HistoryEntry, HistoryKind, HistoryQuery, Paginated } from '../types'

export interface HistoryPageQuery extends HistoryQuery {}

export const historyService = {
  getHistory(query: HistoryPageQuery = {}): Promise<Paginated<HistoryEntry>> {
    return api.request<Paginated<HistoryEntry>>({
      method: 'GET',
      path: '/history',
      query: { page: query.page, pageSize: query.pageSize, kind: query.kind },
    })
  },
}

export type { HistoryEntry, HistoryKind, HistoryQuery }