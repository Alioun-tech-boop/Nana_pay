import {
  mockCredit,
  mockOrders,
  mockSavingsPayments,
  mockVaultTransactions,
  mockWithdrawals,
} from './db'
import { ok, paginate, parseQuery } from './helpers'
import type { MockRoute } from './types'
import type { HistoryEntry } from '../../types'

function buildEntries(): HistoryEntry[] {
  const entries: HistoryEntry[] = []

  for (const order of mockOrders) {
    entries.push({
      id: `his_order_${order.id}`,
      kind: 'ORDER',
      title: `Achat · ${order.product.name}`,
      amount: order.product.price,
      direction: 'OUT',
      date: order.createdAt,
      reference: order.reference,
    })
  }

  for (const payments of Object.values(mockSavingsPayments)) {
    for (const payment of payments) {
      entries.push({
        id: `his_pay_${payment.id}`,
        kind: 'SAVINGS',
        title: 'Versement épargne progressive',
        amount: payment.amount,
        direction: 'IN',
        date: payment.date,
        reference: null,
      })
    }
  }

  for (const transaction of mockVaultTransactions) {
    entries.push({
      id: `his_vtx_${transaction.id}`,
      kind: 'VAULT',
      title: transaction.direction === 'CREDIT' ? 'Versement employeur · Coffre' : `Coffre · ${transaction.orderReference ?? 'Opération'}`,
      amount: transaction.amount,
      direction: transaction.direction === 'CREDIT' ? 'IN' : 'OUT',
      date: transaction.createdAt,
      reference: transaction.orderReference,
    })
  }

  for (const withdrawal of mockWithdrawals) {
    entries.push({
      id: `his_wdr_${withdrawal.id}`,
      kind: 'WITHDRAWAL',
      title: 'Retrait marchand',
      amount: withdrawal.amount,
      direction: 'OUT',
      date: withdrawal.createdAt,
      reference: withdrawal.orderReference,
    })
  }

  if (mockCredit) {
    entries.push({
      id: 'his_credit_001',
      kind: 'CREDIT',
      title: 'Mise à disposition · Crédit bancaire',
      amount: mockCredit.principal,
      direction: 'IN',
      date: mockCredit.createdAt,
      reference: mockCredit.reference,
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

export const historyRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/history',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const kind = query.kind
      const all = kind ? buildEntries().filter((entry) => entry.kind === kind) : buildEntries()
      return ok(paginate(all, page, pageSize))
    },
  },
]