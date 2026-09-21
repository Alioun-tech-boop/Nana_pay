export interface Money {
  amount: number
  currency: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}

export interface ApiErrorPayload {
  code: string
  title: string
  detail: string
  field: string | null
}

export type ServerDate = string