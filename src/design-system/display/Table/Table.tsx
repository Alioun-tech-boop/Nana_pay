import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cx } from '../../utils/className'
import styles from './table.module.css'

export type CellAlign = 'start' | 'center' | 'end'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  dense?: boolean
}

export function Table({ className, dense, children, ...props }: TableProps) {
  return (
    <table className={cx(styles.table, dense && styles['table--dense'], className)} {...props}>
      {children}
    </table>
  )
}

export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function TableContainer({ className, children, ...props }: TableContainerProps) {
  return (
    <div className={cx(styles.container, className)} {...props}>
      {children}
    </div>
  )
}

export function THead({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cx(styles.head, className)} {...props}>
      {children}
    </thead>
  )
}

export function TBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cx(styles.body, className)} {...props}>
      {children}
    </tbody>
  )
}

export function TFoot({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot className={cx(styles.foot, className)} {...props}>
      {children}
    </tfoot>
  )
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean
}

export function Tr({ className, hover, children, ...props }: TrProps) {
  return (
    <tr className={cx(hover && styles.rowHover, className)} {...props}>
      {children}
    </tr>
  )
}

export interface ThProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: CellAlign
}

export function Th({ align, className, children, ...props }: ThProps) {
  return (
    <th scope="col" className={cx(styles.cell, styles.th, align && styles[`cell--${align}`], className)} {...props}>
      {children}
    </th>
  )
}

export interface TdProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: CellAlign
}

export function Td({ align, className, children, ...props }: TdProps) {
  return (
    <td className={cx(styles.cell, styles.td, align && styles[`cell--${align}`], className)} {...props}>
      {children}
    </td>
  )
}