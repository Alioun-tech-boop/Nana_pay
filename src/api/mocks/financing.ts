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
import type { Order, Savings } from '../../types'

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
      const sorted = [...entries].sort((a, b) => b.paidAt.localeCompare(a.paidAt))
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
        })
      }
      const order = findOrder(orderId)
      if (!order) return businessRule('ORDER_NOT_FOUND', 'Commande introuvable', 'Cette commande n’existe pas.')
      if (order.financingMode !== 'SAVINGS') {
        return businessRule('SAVINGS_NOT_ELIGIBLE', 'Épargne non éligible', 'Cette commande ne peut pas être financée par épargne progressive.')
      }
      const item: Savings = {
        id: `sav_01HGEN${mockSavings.length}`,
        orderId: order.id,
        orderReference: order.reference,
        targetAmount: order.product.price,
        savedAmount: { amount: 0, currency: order.product.price.currency },
        progressPercent: 0,
        remainingMonths: 12,
        monthlyTarget: order.product.price,
        maxExtensionMonths: 2,
        penaltyPercent: null,
        refundPercent: null,
        startedAt: daysAhead(0),
        deadline: daysAhead(365),
        cancelledAt: null,
        cancellationReason: null,
        status: 'IN_PROGRESS',
        createdAt: daysAhead(0),
        updatedAt: daysAhead(0),
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
      const body = bodyOf(ctx)
      const savings = mockSavings.find((s) => s.id === ctx.params.id)
      if (!savings) return notFound('SAVINGS_NOT_FOUND', 'Épargne introuvable.')
      if (savings.status !== 'IN_PROGRESS' && savings.status !== 'EXTENDED') {
        return businessRule('SAVINGS_NOT_OPEN', 'Épargne fermée', 'Cette épargne n’accepte plus de versements.')
      }
      const amount = body.amount
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1000) {
        return businessRule(
          'SAVINGS_PAYMENT_AMOUNT_INVALID',
          'Montant invalide',
          'Le versement doit être d’au moins 1 000 F CFA.',
          'amount',
        )
      }
      const remaining = savings.targetAmount.amount - savings.savedAmount.amount
      if (amount > remaining) {
        return businessRule(
          'SAVINGS_PAYMENT_OVER_TARGET',
          'Montant trop élevé',
          'Le montant dépasse le reste à atteindre.',
          'amount',
        )
      }
      savings.savedAmount = { ...savings.savedAmount, amount: savings.savedAmount.amount + amount }
      savings.progressPercent =
        savings.targetAmount.amount > 0
          ? Math.round((savings.savedAmount.amount / savings.targetAmount.amount) * 100)
          : 0
      if (savings.progressPercent >= 100) {
        savings.status = 'REACHED'
        savings.remainingMonths = 0
      }
      const history = mockSavingsPayments[savings.id] ?? []
      history.unshift({
        id: `spy_gen_${Date.now()}`,
        amount: { amount, currency: savings.targetAmount.currency },
        method: body.method === 'CARD' ? 'CARD' : 'MOBILE_MONEY',
        status: 'CONFIRMED',
        providerRef: null,
        paidAt: secondsAgo(0),
      })
      mockSavingsPayments[savings.id] = history
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
    method: 'PUT',
    pattern: '/vault/plan',
    handler: (ctx) => {
      if (!mockVault.eligible) {
        return businessRule('VAULT_NOT_ELIGIBLE', 'Coffre non éligible', 'Votre profil bancaire doit être validé pour définir un plan coffre.')
      }
      const body = bodyOf(ctx)
      const monthlyAmount = body.monthlyAmount
      const targetAmount = body.targetAmount
      if (typeof monthlyAmount !== 'number' || !Number.isInteger(monthlyAmount) || monthlyAmount <= 0) {
        return businessRule(
          'VAULT_PLAN_MONTHLY_INVALID',
          'Montant mensuel invalide',
          'Saisissez un montant mensuel entier supérieur à zéro.',
          'monthlyAmount',
        )
      }
      if (typeof targetAmount !== 'number' || !Number.isInteger(targetAmount) || targetAmount <= 0) {
        return businessRule(
          'VAULT_PLAN_TARGET_INVALID',
          'Somme visée invalide',
          'Saisissez une somme visée entière supérieure à zéro.',
          'targetAmount',
        )
      }
      mockVault.monthlyContribution = { amount: monthlyAmount, currency: mockVault.balance.currency }
      mockVault.targetAmount = { amount: targetAmount, currency: mockVault.balance.currency }
      return ok(mockVault)
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
        return businessRule('VAULT_NOT_ELIGIBLE', 'Coffre non éligible', 'Cette commande n’est pas liée au coffre NanaPay.')
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