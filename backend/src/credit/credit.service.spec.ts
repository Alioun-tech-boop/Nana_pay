// src/credit/credit.service.spec.ts
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Règles métier du crédit bancaire — espace client.
 *
 * Ces tests décrivent les garanties du BACKEND (`AGENTS.md` §1, §10, §14, §19):
 * le montant vient de la commande, la demande n'est jamais dupliquée, une
 * commande d'autrui est introuvable, et aucune décision d'octroi n'est prise
 * ici.
 */

const USER_ID = 'user-1';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';
const REQUEST_ID = '33333333-3333-4333-8333-333333333333';

interface ProfileRow {
  id: string;
  userId: string;
  score: number | null;
  maxAmount: bigint | null;
  status: string;
  validatedAt: Date | null;
  validatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'profile-1',
    userId: USER_ID,
    score: 72,
    maxAmount: 1_000_000n,
    status: 'VALIDATED',
    validatedAt: now,
    validatedBy: 'bank-user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface OrderRow {
  id: string;
  reference: string;
  totalPrice: bigint;
  currency: string;
  financingMode: string;
  userId: string;
  creditRequest: { id: string } | null;
}

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_ID,
    reference: 'NP-2026-00001245',
    totalPrice: 45_000n,
    currency: 'XOF',
    financingMode: 'CREDIT',
    userId: USER_ID,
    creditRequest: null,
    ...overrides,
  };
}

interface RequestRow {
  id: string;
  userId: string;
  orderId: string;
  amount: bigint;
  currency: string;
  termMonths: number;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  decisionReason: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  order: { id: string; reference: string };
}

function makeRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  const now = new Date('2026-01-02T00:00:00.000Z');
  return {
    id: REQUEST_ID,
    userId: USER_ID,
    orderId: ORDER_ID,
    amount: 45_000n,
    currency: 'XOF',
    termMonths: 12,
    status: 'REQUESTED',
    reviewedBy: null,
    reviewedAt: null,
    decisionReason: null,
    idempotencyKey: 'key-1',
    createdAt: now,
    updatedAt: now,
    order: { id: ORDER_ID, reference: 'NP-2026-00001245' },
    ...overrides,
  };
}

function createPrismaMock() {
  const state = {
    profile: makeProfile() as ProfileRow | null,
    order: makeOrder() as OrderRow | null,
    requests: [] as RequestRow[],
    credits: [] as Array<Record<string, unknown>>,
    idempotency: new Map<string, { requestHash: string; responseBody: unknown }>(),
    orderFilter: null as null | ((where: Record<string, unknown>) => boolean),
  };

  const tx = {
    creditRequest: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const created = makeRequest({
          id: REQUEST_ID,
          userId: data.userId as string,
          orderId: data.orderId as string,
          amount: data.amount as bigint,
          currency: data.currency as string,
          termMonths: data.termMonths as number,
          status: data.status as string,
          idempotencyKey: data.idempotencyKey as string,
        });
        state.requests.push(created);
        if (state.order) state.order = { ...state.order, creditRequest: { id: created.id } };
        return created;
      }),
    },
    idempotencyRecord: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: { key: string; endpoint: string; requestHash: string; responseBody: unknown };
        }) => {
          state.idempotency.set(`${data.key}|${data.endpoint}`, {
            requestHash: data.requestHash,
            responseBody: data.responseBody,
          });
          return data;
        },
      ),
    },
  };

  const prisma = {
    state,
    creditProfile: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        state.profile && state.profile.userId === where.userId ? state.profile : null,
      ),
    },
    order: {
      findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (!state.order) return null;
        if (state.orderFilter) return state.orderFilter(where) ? state.order : null;
        return where.id === state.order.id && where.userId === state.order.userId
          ? state.order
          : null;
      }),
    },
    creditRequest: {
      findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => {
        const found = state.requests.find((r) => r.id === where.id);
        if (!found) throw new Error('not found');
        return found;
      }),
      findFirst: jest.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
        const found = state.requests.find(
          (r) =>
            (!where.id || r.id === where.id) && (!where.userId || r.userId === where.userId),
        );
        return found ?? null;
      }),
      findMany: jest.fn(async () => state.requests),
      count: jest.fn(async () => state.requests.length),
    },
    credit: {
      findFirst: jest.fn(
        async () => (state.credits[state.credits.length - 1] as Record<string, unknown>) ?? null,
      ),
    },
    idempotencyRecord: {
      findUnique: jest.fn(
        async ({ where }: { where: { key_endpoint_userId: { key: string; endpoint: string } } }) =>
          state.idempotency.get(
            `${where.key_endpoint_userId.key}|${where.key_endpoint_userId.endpoint}`,
          ) ?? null,
      ),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };

  return prisma as unknown as PrismaService & { state: typeof state };
}

describe('CreditService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: CreditService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CreditService(prisma);
  });

  describe('getEligibility — relue en base, jamais devinée', () => {
    it('est éligible quand le profil est validé', async () => {
      const result = await service.getEligibility(USER_ID);
      expect(result.eligible).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it('explique l’absence de dossier sans lever d’erreur', async () => {
      prisma.state.profile = null;
      const result = await service.getEligibility(USER_ID);
      expect(result.eligible).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('refuse un profil non validé', async () => {
      prisma.state.profile = makeProfile({ status: 'PENDING', validatedAt: null });
      const result = await service.getEligibility(USER_ID);
      expect(result.eligible).toBe(false);
      expect(result.reasons.join(' ')).toMatch(/profil/i);
    });

    it('ne déduit pas la validation du seul statut sans date', async () => {
      // Un statut VALIDATED sans horodatage serait un dossier incohérent :
      // on ne l'accepte pas comme validation.
      prisma.state.profile = makeProfile({ status: 'VALIDATED', validatedAt: null });
      const result = await service.getEligibility(USER_ID);
      expect(result.eligible).toBe(false);
    });
  });

  describe('requestCredit — montant et unicité', () => {
    it('reprend le montant de la commande, jamais celui du client', async () => {
      const dto = await service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k1');
      expect(dto.requestedAmount.amount).toBe(45_000);
      expect(dto.requestedAmount.currency).toBe('XOF');
      expect(dto.orderReference).toBe('NP-2026-00001245');
    });

    it('calcule le taux et le total à rembourser côté serveur', async () => {
      const dto = await service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k2');
      expect(dto.ratePercent).toBe(7);
      // 45 000 + 45 000 × 7 % × 1 an = 48 150
      expect(dto.totalRepayment.amount).toBe(48_150);
    });

    it('place la demande en analyse', async () => {
      const dto = await service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 6 }, 'k3');
      expect(dto.status).toBe('IN_REVIEW');
      expect(dto.decisionReason).toBeNull();
    });

    it('refuse un client non éligible', async () => {
      prisma.state.profile = makeProfile({ status: 'PENDING', validatedAt: null });
      await expect(
        service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k4'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuse une commande destinée à un autre mode de financement', async () => {
      prisma.state.order = makeOrder({ financingMode: 'SAVINGS' });
      await expect(
        service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k5'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('ne trouve pas la commande d’autrui (scopé par utilisateur)', async () => {
      prisma.state.order = makeOrder({ userId: 'someone-else' });
      await expect(
        service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k6'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('renvoie la demande existante au lieu d’en créer une seconde', async () => {
      prisma.state.order = makeOrder({ creditRequest: { id: REQUEST_ID } });
      prisma.state.requests = [makeRequest()];
      const dto = await service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'k7');
      expect(dto.id).toBe(REQUEST_ID);
      expect(prisma.state.requests).toHaveLength(1);
    });
  });

  describe('requestCredit — idempotence', () => {
    it('rejoue la réponse pour la même clé et les mêmes paramètres', async () => {
      const first = await service.requestCredit(
        USER_ID,
        { orderId: ORDER_ID, termMonths: 12 },
        'same-key',
      );
      const second = await service.requestCredit(
        USER_ID,
        { orderId: ORDER_ID, termMonths: 12 },
        'same-key',
      );
      expect(second).toEqual(first);
      expect(prisma.state.requests).toHaveLength(1);
    });

    it('rejette la même clé réutilisée avec d’autres valeurs', async () => {
      await service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 12 }, 'conflict-key');
      await expect(
        service.requestCredit(USER_ID, { orderId: ORDER_ID, termMonths: 6 }, 'conflict-key'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('lecture scopée', () => {
    it('refuse la demande d’un autre client comme introuvable', async () => {
      prisma.state.requests = [makeRequest({ userId: 'someone-else' })];
      await expect(service.getRequest(USER_ID, REQUEST_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('liste uniquement les demandes du client courant', async () => {
      prisma.state.requests = [
        makeRequest({ id: 'r-a', userId: USER_ID }),
        makeRequest({ id: 'r-b', userId: USER_ID }),
      ];
      prisma.state.orderFilter = () => true;
      const result = await service.listRequests(USER_ID, { pageSize: 25 });
      expect(result.items).toHaveLength(2);
    });

    it('renvoie null quand aucun crédit n’a été décaissé', async () => {
      expect(await service.getCredit(USER_ID)).toBeNull();
    });

    it('calcule le restant dû à partir des remboursements réels', async () => {
      prisma.state.credits = [
        {
          id: 'credit-1',
          requestId: REQUEST_ID,
          principal: 45_000n,
          interestRate: 700,
          totalAmount: 48_150n,
          termMonths: 12,
          status: 'REPAYING',
          disbursedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: null,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          repayments: [{ amount: 10_000n }, { amount: 5_000n }],
        },
      ];
      const dto = await service.getCredit(USER_ID);
      expect(dto).not.toBeNull();
      expect(dto!.principal.amount).toBe(45_000);
      expect(dto!.totalAmount.amount).toBe(48_150);
      expect(dto!.remaining.amount).toBe(33_150);
      expect(dto!.ratePercent).toBe(7);
    });

    it('ne renvoie jamais un restant dû négatif', async () => {
      prisma.state.credits = [
        {
          id: 'credit-2',
          requestId: REQUEST_ID,
          principal: 45_000n,
          interestRate: 700,
          totalAmount: 48_150n,
          termMonths: 12,
          status: 'COMPLETED',
          disbursedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-03-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          repayments: [{ amount: 50_000n }],
        },
      ];
      const dto = await service.getCredit(USER_ID);
      expect(dto!.remaining.amount).toBe(0);
    });
  });
});
