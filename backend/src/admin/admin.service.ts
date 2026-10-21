// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedDto, paginate, resolvePageParams } from '../common/utils/pagination';
import type { AdminQuery } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<{ users: number; clients: number; merchants: number; activeOrders: number; paymentsPending: number; creditsToReview: number; volumeThisMonth: number }> {
    // Statuts de commande « encore actives » (avant livraison/règlement définitif).
    const ACTIVE_ORDER_STATUSES = [
      'ORDER_CREATED',
      'FINANCING_IN_PROGRESS',
      'FINANCED',
      'READY_TO_DELIVER',
      'QR_GENERATED',
      'QR_SCANNED',
      'WITHDRAWAL_CONFIRMED',
    ] as const;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [users, clients, merchants, activeOrders, paymentsPending, creditsToReview, volumeAgg] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { roles: { has: 'CLIENT' } } }),
        this.prisma.merchant.count({ where: { status: 'VALIDATED' } }),
        this.prisma.order.count({ where: { status: { in: [...ACTIVE_ORDER_STATUSES] } } }),
        this.prisma.payment.count({ where: { status: 'PENDING' } }),
        this.prisma.creditRequest.count({ where: { status: 'REQUESTED' } }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: startOfMonth } },
          _sum: { totalPrice: true },
        }),
      ]);

    return {
      users,
      clients,
      merchants,
      activeOrders,
      paymentsPending,
      creditsToReview,
      volumeThisMonth: Number(volumeAgg._sum.totalPrice ?? 0),
    };
  }

  async listUsers(query: AdminQuery): Promise<PaginatedDto<{ id: string; fullName: string; email: string | null; roles: string[]; status: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, email: true, roles: true, status: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);

    const items = rows.map((u) => ({
      id: u.id,
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.email,
      // Tous les rôles : un compte peut cumuler CLIENT + MERCHANT, etc.
      roles: u.roles as string[],
      status: u.status,
      createdAt: u.createdAt,
    }));
    return paginate(items, total, page);
  }

  async listMerchants(query: AdminQuery): Promise<PaginatedDto<{ id: string; name: string; email: string | null; status: string; verified: boolean; productsCount: number; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.merchant.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { products: { select: { id: true } }, user: { select: { email: true } } },
      }),
      this.prisma.merchant.count(),
    ]);

    const items = rows.map((m) => ({
      id: m.id,
      name: m.storeName,
      email: m.user?.email ?? null,
      status: m.status,
      verified: m.status === 'VALIDATED',
      productsCount: m.products.length,
      createdAt: m.createdAt,
    }));
    return paginate(items, total, page);
  }

  async listOrders(query: AdminQuery): Promise<PaginatedDto<{ id: string; reference: string; clientFullName: string; amount: number; status: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.order.count(),
    ]);
    return paginate(
      rows.map((o) => ({
        id: o.id,
        reference: o.reference,
        clientFullName: `${o.user.firstName} ${o.user.lastName}`,
        amount: Number(o.totalPrice),
        status: o.status,
        createdAt: o.createdAt,
      })),
      total,
      page,
    );
  }

  async listAudit(query: AdminQuery): Promise<PaginatedDto<{ id: string; actorId: string | null; action: string; scope: string | null; targetId: string | null; at: Date; meta: Record<string, unknown> | null }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.auditEvent.findMany({ skip: page.skip, take: page.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditEvent.count(),
    ]);
    return paginate(
      rows.map((e) => ({
        id: e.id,
        actorId: e.actorId,
        action: e.action,
        scope: e.targetType,
        targetId: e.targetId,
        at: e.createdAt,
        meta: e.metadata as Record<string, unknown>,
      })),
      total,
      page,
    );
  }

  async listPayments(query: AdminQuery): Promise<PaginatedDto<{ id: string; reference: string | null; clientFullName: string; amount: number; currency: string; status: string; method: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.payment.count(),
    ]);
    return paginate(
      rows.map((p) => ({
        id: p.id,
        reference: p.providerRef,
        clientFullName: `${p.user.firstName} ${p.user.lastName}`,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt,
      })),
      total,
      page,
    );
  }

  async listCredits(query: AdminQuery): Promise<PaginatedDto<{ id: string; reference: string; clientFullName: string; amount: number; currency: string; status: string; termMonths: number; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.creditRequest.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.creditRequest.count(),
    ]);
    return paginate(
      rows.map((c) => ({
        id: c.id,
        reference: `CR-${c.id.slice(0, 8).toUpperCase()}`,
        clientFullName: `${c.user.firstName} ${c.user.lastName}`,
        amount: Number(c.amount),
        currency: c.currency,
        status: c.status,
        termMonths: c.termMonths,
        createdAt: c.createdAt,
      })),
      total,
      page,
    );
  }

  async listSavings(query: AdminQuery): Promise<PaginatedDto<{ id: string; orderReference: string; clientFullName: string; targetAmount: number; savedAmount: number; currency: string; status: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.savings.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          order: { select: { reference: true } },
        },
      }),
      this.prisma.savings.count(),
    ]);
    return paginate(
      rows.map((s) => ({
        id: s.id,
        orderReference: s.order.reference,
        clientFullName: `${s.user.firstName} ${s.user.lastName}`,
        targetAmount: Number(s.targetAmount),
        savedAmount: Number(s.savedAmount),
        currency: s.currency,
        status: s.status,
        createdAt: s.createdAt,
      })),
      total,
      page,
    );
  }

  async listVaults(query: AdminQuery): Promise<PaginatedDto<{ id: string; clientFullName: string; balance: number; eligible: boolean; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.vault.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.vault.count(),
    ]);
    return paginate(
      rows.map((v) => ({
        id: v.id,
        clientFullName: `${v.user.firstName} ${v.user.lastName}`,
        balance: Number(v.balance),
        eligible: v.eligible,
        createdAt: v.createdAt,
      })),
      total,
      page,
    );
  }

  async listWithdrawals(query: AdminQuery): Promise<PaginatedDto<{ id: string; orderReference: string; merchantName: string; amount: number; currency: string; status: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          merchant: { select: { storeName: true } },
          order: { select: { reference: true } },
        },
      }),
      this.prisma.withdrawal.count(),
    ]);
    return paginate(
      rows.map((w) => ({
        id: w.id,
        orderReference: w.order.reference,
        merchantName: w.merchant.storeName,
        amount: Number(w.amount),
        currency: w.currency,
        status: w.status,
        createdAt: w.createdAt,
      })),
      total,
      page,
    );
  }

  async listSettlements(query: AdminQuery): Promise<PaginatedDto<{ id: string; merchantName: string; amount: number; commission: number; netAmount: number; currency: string; status: string; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.merchantSettlement.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { merchant: { select: { storeName: true } } },
      }),
      this.prisma.merchantSettlement.count(),
    ]);
    return paginate(
      rows.map((s) => ({
        id: s.id,
        merchantName: s.merchant.storeName,
        amount: Number(s.amount),
        commission: Number(s.commission),
        netAmount: Number(s.netAmount),
        currency: s.currency,
        status: s.status,
        createdAt: s.createdAt,
      })),
      total,
      page,
    );
  }

  async listTransactions(query: AdminQuery): Promise<PaginatedDto<{ id: string; vaultId: string; type: string; amount: number; balanceAfter: number; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.vaultTransaction.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vaultTransaction.count(),
    ]);
    return paginate(
      rows.map((t) => ({
        id: t.id,
        vaultId: t.vaultId,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        createdAt: t.createdAt,
      })),
      total,
      page,
    );
  }

  async listQr(query: AdminQuery): Promise<PaginatedDto<{ id: string; orderReference: string; state: string; expiresAt: Date; createdAt: Date }>> {
    const page = resolvePageParams(query);
    const [rows, total] = await Promise.all([
      this.prisma.qRCode.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { reference: true } } },
      }),
      this.prisma.qRCode.count(),
    ]);
    return paginate(
      rows.map((q) => ({
        id: q.id,
        orderReference: q.order.reference,
        state: q.state,
        // `payload` (JWT signé) n'est JAMAIS exposé à l'admin : donnée sensible.
        expiresAt: q.expiresAt,
        createdAt: q.createdAt,
      })),
      total,
      page,
    );
  }
}
