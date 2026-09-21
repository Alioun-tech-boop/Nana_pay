import type { Money, ServerDate } from './common'

export const HISTORY_KINDS = ['ORDER', 'SAVINGS', 'VAULT', 'WITHDRAWAL', 'CREDIT'] as const

export type HistoryKind = (typeof HISTORY_KINDS)[number]

export const HISTORY_DIRECTIONS = ['IN', 'OUT'] as const

export type HistoryDirection = (typeof HISTORY_DIRECTIONS)[number]

export interface HistoryEntry {
  id: string
  kind: HistoryKind
  title: string
  amount: Money
  direction: HistoryDirection
  date: ServerDate
  reference: string | null
}

export interface HistoryQuery {
  page?: number
  pageSize?: number
  kind?: HistoryKind
}