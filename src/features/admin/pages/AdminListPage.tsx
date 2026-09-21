import type { ReactNode } from 'react'
import { ErrorState } from '../../../design-system'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { ProPageHeader, ProTable, proStyles } from '../../../components/pro'
import type { ProColumn, ProFilter } from '../../../components/pro'
import type { Paginated } from '../../../types'

export interface AdminListPageProps<T> {
  title: string
  columns: ProColumn<T>[]
  rowKey: (row: T) => string
  load: (query: { pageSize: number }) => Promise<Paginated<T>>
  searchable?: (row: T) => string
  searchPlaceholder?: string
  filters?: ProFilter<T>[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  mobileCard?: (row: T) => ReactNode
}

export function AdminListPage<T>({
  title,
  columns,
  rowKey,
  load,
  searchable,
  searchPlaceholder = 'Rechercher…',
  filters,
  emptyTitle,
  emptyDescription,
  emptyAction,
  mobileCard,
}: AdminListPageProps<T>) {
  const data = useRequest(() => load({ pageSize: 100 }), { deps: [] })
  const rows = data.data?.items ?? []

  return (
    <div className={proStyles.page}>
      <ProPageHeader title={title} />
      <ProTable
        aria-label={title}
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        loading={data.isLoading}
        error={
          data.isError ? (
            <ErrorState
              title={`Impossible de charger les ${title.toLowerCase()}`}
              description={toUserMessage(data.error)}
              onRetry={() => void data.refresh()}
            />
          ) : undefined
        }
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        pageSize={10}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={emptyAction}
        mobileCard={mobileCard}
      />
    </div>
  )
}