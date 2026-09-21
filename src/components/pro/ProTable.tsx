import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  EmptyState,
  Icon,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '../../design-system'
import type { CellAlign } from '../../design-system'
import styles from './pro.module.css'

export interface ProColumn<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: CellAlign
  width?: number | string
  sortValue?: (row: T) => string | number
}

export interface ProFilterOption {
  value: string
  label: string
}

export interface ProFilter<T> {
  id: string
  label: string
  options: ProFilterOption[]
  test: (row: T, value: string) => boolean
}

export interface ProTableProps<T> {
  columns: ProColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: ReactNode
  onRowClick?: (row: T) => void
  searchable?: (row: T) => string
  searchPlaceholder?: string
  filters?: ProFilter<T>[]
  toolbar?: ReactNode
  mobileCard?: (row: T) => ReactNode
  emptyTitle?: string
  emptyDescription?: ReactNode
  emptyAction?: ReactNode
  pageSize?: number
  dense?: boolean
  caption?: ReactNode
  'aria-label'?: string
}

type SortDirection = 'asc' | 'desc'

export function ProTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error,
  onRowClick,
  searchable,
  searchPlaceholder = 'Rechercher…',
  filters,
  toolbar,
  mobileCard,
  emptyTitle = 'Aucun résultat',
  emptyDescription,
  emptyAction,
  pageSize = 10,
  dense = true,
  caption,
  'aria-label': ariaLabel,
}: ProTableProps<T>) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const filter of filters ?? []) initial[filter.id] = filter.options[0]?.value ?? ''
    return initial
  })
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)

  const processed = useMemo(() => {
    let items = [...rows]
    const needle = search.trim().toLowerCase()
    if (needle && searchable) {
      items = items.filter((row) => searchable(row).toLowerCase().includes(needle))
    }
    for (const filter of filters ?? []) {
      const value = filterValues[filter.id]
      if (value) items = items.filter((row) => filter.test(row, value))
    }
    const column = columns.find((item) => item.key === sortKey)
    if (column?.sortValue) {
      const sortValue = column.sortValue
      items.sort((a, b) => {
        const left = sortValue(a)
        const right = sortValue(b)
        if (left < right) return sortDirection === 'asc' ? -1 : 1
        if (left > right) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return items
  }, [rows, search, searchable, filters, filterValues, columns, sortKey, sortDirection])

  const pageCount = Math.max(1, Math.ceil(processed.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = processed.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (column: ProColumn<T>) => {
    if (!column.sortValue) return
    if (sortKey === column.key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column.key)
      setSortDirection('asc')
    }
  }

  const hasToolbar = Boolean(searchable) || (filters?.length ?? 0) > 0 || Boolean(toolbar)

  const isEmpty = !loading && !error && processed.length === 0

  return (
    <div className={mobileCard ? `${styles.wrap} ${styles.mobile}` : styles.wrap}>
      {hasToolbar ? (
        <div className={styles.toolbar}>
          {searchable ? (
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder={searchPlaceholder}
              className={styles.search}
            />
          ) : null}
          <div className={styles.filterRow}>
            {(filters ?? []).map((filter) => (
              <Select
                key={filter.id}
                label={filter.label}
                value={filterValues[filter.id] ?? ''}
                onChange={(event) => {
                  setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))
                  setPage(1)
                }}
                className={styles.filter}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
          {toolbar ? <div className={styles.toolbarActions}>{toolbar}</div> : null}
        </div>
      ) : null}

      {error ? (
        error
      ) : isEmpty ? (
        <EmptyState icon="search" title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table dense={dense} aria-label={caption ? undefined : ariaLabel}>
              {caption ? <caption className={styles.caption}>{caption}</caption> : null}
              <THead>
                <Tr>
                  {columns.map((column) => (
                    <Th
                      key={column.key}
                      align={column.align}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.sortValue ? (
                        <button type="button" className={styles.sort} onClick={() => toggleSort(column)}>
                          {column.header}
                          <span
                            className={styles.sortIcon}
                            aria-label={
                              sortKey === column.key
                                ? sortDirection === 'asc'
                                  ? 'Tri croissant'
                                  : 'Tri décroissant'
                                : 'Trier'
                            }
                          >
                            <Icon
                              name={
                                sortKey === column.key && sortDirection === 'desc'
                                  ? 'chevron-down'
                                  : 'chevron-up'
                              }
                              size={13}
                            />
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {loading
                  ? Array.from({ length: Math.min(pageSize, 6) }, (_, index) => (
                      <Tr key={`skeleton-${index}`}>
                        {columns.map((column) => (
                          <Td key={column.key} align={column.align}>
                            <Skeleton width={column.key === 'actions' ? 72 : undefined} height={16} />
                          </Td>
                        ))}
                      </Tr>
                    ))
                  : visible.map((row) => (
                      <Tr
                        key={rowKey(row)}
                        hover={Boolean(onRowClick)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        onKeyDown={
                          onRowClick
                            ? (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  onRowClick(row)
                                }
                              }
                            : undefined
                        }
                        className={onRowClick ? styles.clickable : undefined}
                      >
                        {columns.map((column) => (
                          <Td
                            key={column.key}
                            align={column.align}
                            style={column.width ? { width: column.width } : undefined}
                          >
                            {column.render(row)}
                          </Td>
                        ))}
                      </Tr>
                    ))}
              </TBody>
            </Table>
          </div>

          {mobileCard ? (
            <div className={styles.cards}>
              {visible.map((row) => (
                <div
                  key={rowKey(row)}
                  className={styles.card}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {mobileCard(row)}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}

      {!error && !isEmpty && pageCount > 1 ? (
        <div className={styles.pagination}>
          <span className={styles.count}>
            {processed.length} résultat{processed.length > 1 ? 's' : ''}
          </span>
          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
