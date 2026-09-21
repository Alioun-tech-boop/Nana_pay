import {
  mockCredit,
  mockCreditRequests,
  mockOrders,
  mockSavings,
  mockSavingsPayments,
  mockVault,
  mockVaultTransactions,
} from './db'
import {
  accepted,
  bodyOf,
  businessRule,
  created,
  daysAhead,
  notFound,
  ok,
  paginate,
  parseQuery,
  secondsAgo,
} from './helpers'
import type { MockRoute } from './types'
import type { Order } from '../../types'

function findOrder(orderId: string): Order | undefined {
  return mockOrders.find((order) => order.id === orderId)
}

export const financingRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/savings',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      return ok(paginate(mockSavings, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/savings/:id',
    handler: (ctx) => {
      const item = mockSavings.find((savings) => savings.id === ctx.params.id)
      if (!item) return notFound('SAVINGS_NOT_FOUND', 'Épargne introuvable.')
      return ok(item)
    },
  },
  {
    method: 'GET',
    pattern: '/savings/:id/history',
    handler: (ctx) => {
      const entries = mockSavingsPayments[ctx.params.id] ?? []
      const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
      return ok(paginate(sorted, 1, 50))
    },
  },
  {
    method: 'POST',
    pattern: '/savings/start',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const orderId = typeof body.orderId === 'string' ? body.orderId : ''
      if (body.orderId === 'ord_01HACTIVE') {
        return created({
          id: 'sav_01HSAV1',
          orderId: 'ord_01HACTIVE',
          orderReference: 'NP-2026-00001245',
          targetAmount: { amount: 125000, currency: 'XOF' },
          savedAmount: { amount: 42500, currency: 'XOF' },
          progressPercent: 34,
          remainingMonths: 3,
          maxExtensionMonths: 2,
          startedAt: daysAhead(0),
          deadline: daysAhead(96),
          status: 'IN_PROGRESS',
          nextPaymentDue: { amount: 15000, currency: 'XOF' },
        })
      }
      const order = findOrder(orderId)
      if (!order) return businessRule('ORDER_NOT_FOUND', 'Commande introuvable', 'Cette commande n’existe pas.')
      if (order.financingMode !== 'SAVINGS') {
        return businessRule('SAVINGS_NOT_ELIGIBLE', 'Épargne non éligible', 'Cette commande ne peut pas être financée par épargne progressive.')
      }
      const amount = order.product.price.amount
      const item = {
        id: `sav_01HGEN${mockSavings.length}`,
        orderId: order.id,
        orderReference: order.reference,
        targetAmount: order.product.price,
        savedAmount: { amount: 0, currency: order.product.price.currency },
        progressPercent: 0,
        remainingMonths: 12,
        maxExtensionMonths: 2,
        startedAt: daysAhead(0),
        deadline: daysAhead(365),
        status: 'IN_PROGRESS' as const,
        nextPaymentDue: { amount: Math.round(amount / 12 / 500) * 500, currency: order.product.price.currency },
      }
      mockSavings.push(item)
      mockSavingsPayments[item.id] = []
      return created(item)
    },
  },
  {
    method: 'POST',
    pattern: '/savings/:id/payment',
    handler: (ctx) => {
      const savings = mockSavings.find((s) => s.id === ctx.params.id)
      const saved = savings?.savedAmount.amount ?? 0
      const target = savings?.targetAmount.amount ?? 0
      const due = savings?.nextPaymentDue.amount ?? 0
      if (savings && saved < target) {
        savings.savedAmount = { ...savings.savedAmount, amount: Math.min(target, saved + due) }
        savings.progressPercent = target > 0 ? Math.round((savings.savedAmount.amount / target) * 100) : 0
      }
      if (savings && savings.progressPercent >= 100) {
        savings.status = 'REACHED'
        savings.remainingMonths = 0
        savings.nextPaymentDue = { amount: 0, currency: savings.targetAmount.currency }
      }
      if (savings) {
        const history = mockSavingsPayments[savings.id] ?? []
        history.unshift({
          id: `spy_gen_${Date.now()}`,
          amount: { amount: due, currency: savings.targetAmount.currency },
          date: secondsAgo(0).slice(0, 10),
          status: 'CONFIRMED',
        })
        mockSavingsPayments[savings.id] = history
      }
      return accepted({ accepted: true })
    },
  },
  {
    method: 'GET',
    pattern: '/vault',
    handler: () => ok(mockVault),
  },
  {
    method: 'GET',
    pattern: '/vault/transactions',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      return ok(paginate(mockVaultTransactions, page, pageSize))
    },
  },
  {
    method: 'POST',
    pattern: '/vault/use',
    handler: (ctx) => {
      if (!mockVault.eligible) {
        return businessRule('VAULT_NOT_ELIGIBLE', 'Coffre non éligible', 'Votre profil bancaire doit être validé pour utiliser le coffre.')
      }
      const body = bodyOf(ctx)
      if (typeof body.orderId !== 'string') {
        return businessRule('ORDER_REQUIRED', 'Commande requise', 'Une commande valide est nécessaire.')
      }
      const order = findOrder(body.orderId)
      if (!order) return businessRule('ORDER_NOT_FOUND', 'Commande introuvable', 'Cette commande n’existe pas.')
      if (order.financingMode !== 'VAULT') {
        return businessRule('VAULT_NOT_ELIGIBLE', 'Coffre non éligible', 'Cette commande n’est pas liée au coffre NanoPay.')
      }
      if (order.product.price.amount > mockVault.balance.amount) {
        return businessRule('VAULT_BALANCE_INSUFFICIENT', 'Solde insuffisant', 'Le solde du coffre ne couvre pas cette commande.')
      }
      mockVault.balance = {
        ...mockVault.balance,
        amount: mockVault.balance.amount - order.product.price.amount,
      }
      mockVaultTransactions.unshift({
        id: `vtx_gen_${Date.now()}`,
        direction: 'DEBIT',
        amount: order.product.price,
        orderReference: order.reference,
        createdAt: secondsAgo(5),
      })
      order.financing = {
        id: `fin_01HVAUL${Date.now()}`,
        status: 'SETTLED',
        amount: order.product.price,
      }
      order.status = 'FINANCED'
      order.updatedAt = secondsAgo(5)
      return created({ used: true, orderId: body.orderId })
    },
  },
  {
    method: 'GET',
    pattern: '/credit/eligibility',
    handler: () => ok({ eligible: true, reasons: [] }),
  },
  {
    method: 'POST',
    pattern: '/credit/request',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const termMonths = typeof body.termMonths === 'number' ? body.termMonths : 12
      if (termMonths < 3 || termMonths > 24) {
        return businessRule('CREDIT_TERM_INVALID', 'Durée invalide', 'La durée doit être comprise entre 3 et 24 mois.', 'termMonths')
      }
      const order = findOrder(String(body.orderId ?? ''))
      const amount = order?.product.price ?? { amount: 690000, currency: 'XOF' }
      const request = {
        id: `cre_01HNEW${Date.now()}`,
        orderReference: order?.reference ?? 'NP-2026-00001300',
        clientId: 'usr_01HCLIENT',
        requestedAmount: amount,
        termMonths,
        status: 'IN_REVIEW' as const,
        decisionReason: null,
        createdAt: secondsAgo(10),
      }
      mockCreditRequests.push(request)
      return created(request)
    },
  },
  {
    method: 'GET',
    pattern: '/credit/requests/:id',
    handler: (ctx) => {
      const item = mockCreditRequests.find((request) => request.id === ctx.params.id)
      if (!item) return notFound('CREDIT_REQUEST_NOT_FOUND', 'Demande de crédit introuvable.')
      return ok(item)
    },
  },
  {
    method: 'GET',
    pattern: '/credit/requests',
    handler: (ctx) => {
      const query = parseQuery(ctx.query)
      const page = Number.parseInt(query.page ?? '1', 10)
      const pageSize = Number.parseInt(query.pageSize ?? '25', 10)
      const sorted = [...mockCreditRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return ok(paginate(sorted, page, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/credit',
    handler: () => ok(mockCredit),
  },
]