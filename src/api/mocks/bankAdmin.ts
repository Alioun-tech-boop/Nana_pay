import { mockCreditRequests, mockMerchants, mockOrders, mockUser, mockWithdrawals } from './db'
import {
  mockAdminAudit,
  mockAdminKyc,
  mockAdminQr,
  mockAdminSavings,
  mockAdminTransactions,
  mockAdminVaults,
  mockBankCredits,
  mockBankProfileDetails,
  mockBankProfiles,
  mockBankTransfers,
  mockMerchantOrders,
  mockProUsers,
} from './proDb'
import { bodyOf, businessRule, notFound, ok, paginate, secondsAgo } from './helpers'
import type { MockContext, MockRoute } from './types'
import type { PaymentStatus } from '../../types'

function paging(ctx: MockContext): { page: number; pageSize: number } {
  return {
    page: Number.parseInt(ctx.query.page ?? '1', 10),
    pageSize: Number.parseInt(ctx.query.pageSize ?? '25', 10),
  }
}

function paymentStatusFrom(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED',
  }
  return map[status] ?? 'PENDING'
}

export const bankAdminRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/bank/summary',
    handler: () =>
      ok({
        requestsToReview: mockCreditRequests.filter((request) => request.status === 'IN_REVIEW').length,
        approvedThisMonth: mockBankCredits.filter((credit) => credit.status === 'ACTIVE').length,
        refusedThisMonth: mockCreditRequests.filter((request) => request.status === 'REFUSED').length,
        disbursedThisMonth: {
          amount: mockBankTransfers
            .filter((transfer) => transfer.status !== 'PENDING')
            .reduce((total, transfer) => total + transfer.amount.amount, 0),
          currency: 'XOF',
        },
        portfolioOutstanding: {
          amount: mockBankCredits
            .filter((credit) => credit.status !== 'COMPLETED')
            .reduce((total, credit) => total + credit.remaining.amount, 0),
          currency: 'XOF',
        },
        defaultRate: 4.2,
      }),
  },
  {
    method: 'GET',
    pattern: '/bank/profiles',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const query = ctx.query
      let items = [...mockBankProfiles]
      if (query.q) {
        const needle = query.q.toLowerCase()
        items = items.filter(
          (profile) =>
            profile.fullName.toLowerCase().includes(needle) ||
            profile.email.toLowerCase().includes(needle) ||
            profile.city.toLowerCase().includes(needle),
        )
      }
      if (query.riskLevel) items = items.filter((profile) => profile.riskLevel === query.riskLevel)
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/bank/profiles/:id',
    handler: (ctx) => {
      const detail = mockBankProfileDetails[ctx.params.id]
      if (!detail) return notFound('CLIENT_PROFILE_NOT_FOUND', 'Profil client introuvable.')
      return ok(detail)
    },
  },
  {
    method: 'GET',
    pattern: '/bank/credit-requests',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const query = ctx.query
      let items = Object.values(mockBankProfileDetails).flatMap((profile) =>
        profile.requests.map((request) => ({
          id: request.id,
          clientId: request.clientId,
          clientFullName: profile.fullName,
          orderReference: request.orderReference,
          requestedAmount: request.requestedAmount,
          termMonths: request.termMonths,
          status: request.status,
          decisionReason: request.decisionReason,
          createdAt: request.createdAt,
          riskLevel: profile.riskLevel,
        })),
      )
      if (query.status) items = items.filter((request) => request.status === query.status)
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/bank/credit-requests/:id',
    handler: (ctx) => {
      for (const profile of Object.values(mockBankProfileDetails)) {
        const request = profile.requests.find((item) => item.id === ctx.params.id)
        if (request) {
          return ok({
            id: request.id,
            clientId: request.clientId,
            clientFullName: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            employer: profile.employer,
            yearsAtWork: profile.yearsAtWork,
            monthlySalary: profile.monthlySalary,
            salaryVerified: profile.salaryVerified,
            bankProfileValidated: profile.bankProfileValidated,
            riskLevel: profile.riskLevel,
            orderReference: request.orderReference,
            requestedAmount: request.requestedAmount,
            termMonths: request.termMonths,
            status: request.status,
            decisionReason: request.decisionReason,
            createdAt: request.createdAt,
            documents: profile.documents,
            history: profile.requests,
          })
        }
      }
      return notFound('CREDIT_REQUEST_NOT_FOUND', 'Demande de crédit introuvable.')
    },
  },
  {
    method: 'POST',
    pattern: '/bank/credit-requests/:id/decision',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const decision = body.decision
      if (decision !== 'APPROVED' && decision !== 'REFUSED') {
        return businessRule('DECISION_INVALID', 'Décision invalide', 'La décision doit être APPROVED ou REFUSED.', 'decision')
      }
      for (const profile of Object.values(mockBankProfileDetails)) {
        const request = profile.requests.find((item) => item.id === ctx.params.id)
        if (request) {
          request.status = decision
          request.decisionReason = typeof body.reason === 'string' ? body.reason : null
          return ok({ ...request })
        }
      }
      return notFound('CREDIT_REQUEST_NOT_FOUND', 'Demande de crédit introuvable.')
    },
  },
  {
    method: 'GET',
    pattern: '/bank/credits',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const query = ctx.query
      let items = [...mockBankCredits]
      if (query.status) items = items.filter((credit) => credit.status === query.status)
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/bank/transfers',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const query = ctx.query
      let items = [...mockBankTransfers]
      if (query.status) items = items.filter((transfer) => transfer.status === query.status)
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/bank/orders',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockOrders.map((order) => ({
        id: order.id,
        reference: order.reference,
        clientFullName: order.client.fullName,
        amount: order.product.price,
        status: order.status,
        createdAt: order.createdAt,
      }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/bank/settlements',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = [
        {
          id: 'stl_01',
          orderReference: 'NP-2026-00001183',
          merchantId: 'mer_01HMEGA1',
          amount: { amount: 165000, currency: 'XOF' },
          status: 'SETTLED',
          createdAt: secondsAgo(44 * 86_400),
        },
      ]
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/summary',
    handler: () => {
      const completedStatuses = ['DELIVERED', 'MERCHANT_PAID', 'COMPLETED']
      const volume = mockAdminTransactions.reduce((total, txn) => total + txn.amount.amount, 0)
      return ok({
        users: 1 + mockBankProfiles.length + Object.keys(mockProUsers).length,
        clients: mockBankProfiles.length + 1,
        merchants: mockMerchants.length,
        activeOrders: mockOrders.filter((order) => !completedStatuses.includes(order.status)).length,
        pendingKyc: mockAdminKyc.filter((record) => record.status === 'PENDING').length,
        paymentsPending: mockAdminTransactions.filter((txn) => txn.status === 'PROCESSING' || txn.status === 'PENDING').length,
        creditsToReview: mockCreditRequests.filter((request) => request.status === 'IN_REVIEW').length,
        volumeThisMonth: { amount: volume, currency: 'XOF' },
      })
    },
  },
  {
    method: 'GET',
    pattern: '/admin/users',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = [
        {
          id: mockUser.id,
          fullName: mockUser.fullName,
          email: mockUser.email,
          role: mockUser.role,
          status: 'ACTIVE',
          createdAt: secondsAgo(90 * 86_400),
        },
        ...mockBankProfiles.map((profile) => ({
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          role: 'CLIENT' as const,
          status: profile.bankProfileValidated ? 'ACTIVE' : 'PENDING',
          createdAt: new Date(profile.createdAt).toISOString(),
        })),
        ...Object.values(mockProUsers).map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: 'ACTIVE',
          createdAt: secondsAgo(200 * 86_400),
        })),
      ]
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/merchants',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockMerchants.map((merchant) => ({
        id: merchant.id,
        name: merchant.name,
        email: `contact@${merchant.slug}.example`,
        city: merchant.city,
        status: merchant.verified ? 'ACTIVE' : 'PENDING_REVIEW',
        verified: merchant.verified,
        productsCount:
          merchant.id === 'mer_01HPLUS1'
            ? 6
            : merchant.id === 'mer_01HMEGA1'
              ? 2
              : merchant.id === 'mer_01HRIDE1'
                ? 2
                : merchant.id === 'mer_01HTECK1'
                  ? 1
                  : merchant.id === 'mer_01HHOME1'
                    ? 1
                    : 2,
        createdAt: new Date(merchant.createdAt).toISOString(),
      }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/orders',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockOrders.map((order) => ({
        id: order.id,
        reference: order.reference,
        clientFullName: order.client.fullName,
        amount: order.product.price,
        status: order.status,
        createdAt: order.createdAt,
      }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/payments',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockAdminTransactions.map((txn) => ({
        id: txn.id,
        reference: txn.reference,
        clientFullName: txn.clientFullName,
        amount: txn.amount,
        status: paymentStatusFrom(txn.status),
        createdAt: txn.createdAt,
      }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/credits',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockBankCredits.map((credit) => ({
        id: credit.id,
        clientFullName: credit.clientFullName,
        orderReference: credit.orderReference,
        amount: credit.principal,
        status: credit.status,
        createdAt: credit.createdAt,
      }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/kyc',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      return ok(paginate(mockAdminKyc, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/savings',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      return ok(paginate(mockAdminSavings, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/vaults',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      return ok(paginate(mockAdminVaults, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/qr',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      return ok(paginate(mockAdminQr, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/withdrawals',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockWithdrawals.map((withdrawal) => {
        const order = mockOrders.find((item) => item.id === withdrawal.orderId)
        return {
          id: withdrawal.id,
          orderReference: withdrawal.orderReference,
          merchantName: order?.merchant.name ?? '—',
          amount: withdrawal.amount,
          method: withdrawal.method,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt,
        }
      })
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/settlements',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const items = mockMerchantOrders
        .filter((order) => order.withdrawalStatus === 'CONFIRMED')
        .map((order) => ({
          id: `stl_${order.id}`,
          orderReference: order.reference,
          merchantName: 'ElectroPlus Abidjan',
          amount: order.amount,
          status: order.status === 'COMPLETED' || order.status === 'MERCHANT_PAID' ? 'SETTLED' : 'PENDING',
          createdAt: order.updatedAt,
        }))
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/transactions',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      const query = ctx.query
      let items = [...mockAdminTransactions]
      if (query.type) items = items.filter((txn) => txn.type === query.type)
      if (query.status) items = items.filter((txn) => txn.status === query.status)
      return ok(paginate(items, currentPage, pageSize))
    },
  },
  {
    method: 'GET',
    pattern: '/admin/audit',
    handler: (ctx) => {
      const { page: currentPage, pageSize } = paging(ctx)
      return ok(paginate(mockAdminAudit, currentPage, pageSize))
    },
  },
]
