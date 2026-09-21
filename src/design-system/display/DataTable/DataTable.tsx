import type { KeyboardEvent, ReactNode } from 'react'
import { Table, THead, TBody, TFoot, Tr, Th, Td } from '../Table/Table'
import type { CellAlign } from '../Table/Table'
import { Skeleton } from '../Skeleton/Skeleton'
import { EmptyState } from '../../feedback/EmptyState/EmptyState'
import styles from './dataTable.module.css'

export interface DataTableColumn<T> {
  key: string
  header?: ReactNode
  render?: (row: T) => ReactNode
  align?: CellAlign
  width?: number | string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  dense?: boolean
  caption?: ReactNode
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
  className?: string
  'aria-label'?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  dense = false,
  caption,
  emptyState,
  onRowClick,
  className,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  const handleRowKeyDown = (row: T) => (event: KeyboardEvent<HTMLTableRowElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && onRowClick) {
      event.preventDefault()
      onRowClick(row)
    }
  }

  const widthStyle = (column: DataTableColumn<T>) =>
    column.width !== undefined ? { width: column.width } : undefined

  return (
    <div className={className}>
      <Table dense={dense} aria-label={caption ? undefined : ariaLabel}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <THead>
          <Tr>
            {columns.map((column) => (
              <Th key={column.key} align={column.align} style={widthStyle(column)}>
                {column.header ?? column.key}
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <Tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <Td key={column.key} align={column.align}>
                      <Skeleton width={column.key === 'actions' ? 56 : undefined} height={16} />
                    </Td>
                  ))}
                </Tr>
              ))
            : rows.length === 0
              ? (
              <Tr>
                <Td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyState ?? (
                    <EmptyState
                      title="Aucune donnée à afficher"
                      description="Les informations apparaîtront ici dès qu'elles seront disponibles."
                    />
                  )}
                </Td>
              </Tr>
              )
              : rows.map((row) => (
                  <Tr
                    key={rowKey(row)}
                    hover={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? handleRowKeyDown(row) : undefined}
                    className={onRowClick ? styles.clickableRow : undefined}
                  >
                    {columns.map((column) => (
                      <Td key={column.key} align={column.align} style={widthStyle(column)}>
                        {column.render ? column.render(row) : (row as unknown as Record<string, ReactNode>)[column.key]}
                      </Td>
                    ))}
                  </Tr>
                ))}
        </TBody>
      </Table>
    </div>
  )
}

export { TFoot as DataTableFooter }