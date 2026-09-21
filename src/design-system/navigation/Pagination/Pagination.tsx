import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import styles from './pagination.module.css'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

type PageItem = number | 'left' | 'right'

function getPaginationItems(page: number, total: number, siblingCount: number): PageItem[] {
  const safeTotal = Math.max(1, total)
  const current = Math.min(safeTotal, Math.max(1, page))
  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1)
  }
  const left = Math.max(2, current - siblingCount)
  const right = Math.min(safeTotal - 1, current + siblingCount)
  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < safeTotal - 1
  const items: PageItem[] = [1]
  if (showLeftEllipsis) items.push('left')
  for (let value = left; value <= right; value += 1) items.push(value)
  if (showRightEllipsis) items.push('right')
  items.push(safeTotal)
  return items
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const safeCount = Math.max(1, pageCount)
  const safePage = Math.min(safeCount, Math.max(1, page))
  const items = getPaginationItems(safePage, safeCount, siblingCount)

  const goTo = (next: number) => {
    const clamped = Math.min(safeCount, Math.max(1, next))
    if (clamped !== safePage) onPageChange(clamped)
  }

  return (
    <nav aria-label="Pagination" className={cx(styles.pagination, className)}>
      <button
        type="button"
        className={cx(styles.nav, styles.prev)}
        onClick={() => goTo(safePage - 1)}
        disabled={safePage <= 1}
        aria-label="Page précédente"
      >
        <Icon name="chevron-left" size={16} />
      </button>
      <ul className={styles.list}>
        {items.map((item) =>
          item === 'left' || item === 'right' ? (
            <li key={`ellipsis-${item}`} className={styles.ellipsis} aria-hidden="true">
              <Icon name="more" size={16} />
            </li>
          ) : (
            <li key={`page-${item}`}>
              <button
                type="button"
                className={cx(styles.page, item === safePage && styles.pageActive)}
                onClick={() => goTo(item)}
                aria-label={`Page ${item}`}
                aria-current={item === safePage ? 'page' : undefined}
              >
                <span className="np-number">{item}</span>
              </button>
            </li>
          ),
        )}
      </ul>
      <button
        type="button"
        className={cx(styles.nav, styles.next)}
        onClick={() => goTo(safePage + 1)}
        disabled={safePage >= safeCount}
        aria-label="Page suivante"
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  )
}