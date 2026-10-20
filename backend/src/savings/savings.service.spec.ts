// src/savings/savings.service.spec.ts
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Règles financières de l'épargne progressive.
 *
 * Ces tests décrivent ce que le BACKEND garantit (`AGENTS.md` §10, §12, §14) :
 * le frontend affiche ces règles mais ne les applique jamais comme vérité.
 */

const USER_ID = 'user-1';
const SAVINGS_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

interface SavingsRow {
  id: string;
  orderId: string;
  userId: string;
  targetAmount: bigint;
  savedAmount: bigint;
  currency: string;
  monthlyTarget: bigint | null;
  status: string;
  startedAt: Date;
  deadline: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  order: { id: string; reference: string };
}

function makeSavings(overrides: Partial<SavingsRow> = {}): SavingsRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: SAVINGS_ID,
    orderId: ORDER_ID,
    userId: USER_ID,
    targetAmount: 250_000n,
    savedAmount: 85_000n,
    currency: 'XOF',
    monthlyTarget: 41_666n,
    status: 'IN_PROGRESS',
    startedAt: now,
    deadline: new Date('2026-07-01T00:00:00.000Z'),
    cancelledAt: null,
    cancellationReason: null,
    version: 3,
    createdAt: now,
    updatedAt: now,
    order: { id: ORDER_ID, reference: 'NP-2026-00001245' },
    ...overrides,
  };
}

/**
 * Prisma simulé, limité aux opérations réellement utilisées par le service.
 * On décrit un comportement observable plutôt qu'une implémentation.
 */
function createPrismaMock() {
  const state = {
    savings: makeSavings(),
    order: {
      id: ORDER_ID,
      totalPrice: 250_000n,
      currency: 'XOF',
      financingMode: 'SAVINGS' as string,
      userId: USER_ID,
    },
    idempotency: new Map<string, { requestHash: string; responseBody: unknown }>(),
    payments: [] as Array<Record<string, unknown>>,
    createdSavings: null as SavingsRow | null,
  };

  const tx = {
    savings: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const created = makeSavings({
          ...(data as unknown as Partial<SavingsRow>),
          savedAmount: 0n,
          order: state.savings.order,
        });
        state.createdSavings = created;
        return created;
      }),
      updateMany: jest.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          if (where.version !== state.savings.version) return { count: 0 };
          state.savings = {
            ...state.savings,
            savedAmount: data.savedAmount as bigint,
            status: data.status as string,
            version: state.savings.version + 1,
          };
          return { count: 1 };
        },
      ),
      findUniqueOrThrow: jest.fn(async () => state.savings),
      findUnique: jest.fn(async () => state.savings),
    },
    savingsPayment: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.payments.push(data);
        return data;
      }),
    },
    idempotencyRecord: {
      create: jest.fn(
        async ({ data }: { data: { key: string; endpoint: string; requestHash: string; responseBody: unknown } }) => {
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
    order: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; userId: string } }) =>
        where.id === state.order.id && where.userId === state.order.userId ? state.order : null,
      ),
    },
    savings: {
      findUnique: jest.fn(async ({ where }: { where: { orderId?: string; id?: string } }) =>
        where.orderId === state.savings.orderId || where.id === state.savings.id
          ? state.savings
          : null,
      ),
      findUniqueOrThrow: jest.fn(async () => state.savings),
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; userId: string } }) =>
          where.id === state.savings.id && where.userId === state.savings.userId
            ? state.savings
            : null,
      ),
      findMany: jest.fn(async () => [state.savings]),
      count: jest.fn(async () => 1),
    },
    savingsPayment: {
      findMany: jest.fn(async () => state.payments),
      count: jest.fn(async () => state.payments.length),
    },
    idempotencyRecord: {
      findUnique: jest.fn(
        async ({ where }: { where: { key_endpoint_userId: { key: string; endpoint: string } } }) => {
          const found = state.idempotency.get(
            `${where.key_endpoint_userId.key}|${where.key_endpoint_userId.endpoint}`,
          );
          return found ? found : null;
        },
      ),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };

  return prisma as unknown as PrismaService & { state: typeof state };
}

describe('SavingsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SavingsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SavingsService(prisma);
  });

  describe('startSavings', () => {
    it('refuse une commande inexistante ou n’appartenant pas à l’utilisateur', async () => {
      await expect(
        service.startSavings(USER_ID, '33333333-3333-4333-8333-333333333333', 'key-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse une commande qui n’est pas financée par épargne', async () => {
      prisma.state.order.financingMode = 'CREDIT';
      await expect(
        service.startSavings(USER_ID, ORDER_ID, 'key-2'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('makePayment — règles de montant', () => {
    it('refuse un versement sous le minimum de 1 000 F CFA', async () => {
      await expect(
        service.makePayment(USER_ID, SAVINGS_ID, { amount: 999, method: 'MOBILE_MONEY' }, 'k1'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('refuse un versement dépassant le reste à atteindre', async () => {
      // Reste à atteindre : 250 000 − 85 000 = 165 000.
      await expect(
        service.makePayment(USER_ID, SAVINGS_ID, { amount: 165_001, method: 'MOBILE_MONEY' }, 'k2'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('accepte un versement égal au reste à atteindre et marque l’objectif atteint', async () => {
      const result = await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 165_000, method: 'MOBILE_MONEY' },
        'k3',
      );

      expect(result.savedAmount.amount).toBe(250_000);
      expect(result.progressPercent).toBe(100);
      expect(result.status).toBe('REACHED');
    });

    it('accepte le versement minimum exact de 1 000 F CFA', async () => {
      const result = await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 1_000, method: 'CARD' },
        'k4',
      );

      expect(result.savedAmount.amount).toBe(86_000);
    });

    it('met à jour la progression à partir des montants serveur', async () => {
      const result = await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 40_000, method: 'MOBILE_MONEY' },
        'k5',
      );

      // 125 000 / 250 000 = 50 %
      expect(result.savedAmount.amount).toBe(125_000);
      expect(result.progressPercent).toBe(50);
    });
  });

  describe('makePayment — état de l’épargne', () => {
    it('refuse un versement sur une épargne introuvable (ou d’un autre utilisateur)', async () => {
      prisma.state.savings = makeSavings({ userId: 'someone-else' });
      await expect(
        service.makePayment(USER_ID, SAVINGS_ID, { amount: 5_000, method: 'MOBILE_MONEY' }, 'k6'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse un versement sur une épargne annulée', async () => {
      prisma.state.savings = makeSavings({ status: 'CANCELLED' });
      await expect(
        service.makePayment(USER_ID, SAVINGS_ID, { amount: 5_000, method: 'MOBILE_MONEY' }, 'k7'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('refuse un versement sur une épargne en échec', async () => {
      prisma.state.savings = makeSavings({ status: 'FAILED' });
      await expect(
        service.makePayment(USER_ID, SAVINGS_ID, { amount: 5_000, method: 'MOBILE_MONEY' }, 'k8'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('makePayment — idempotence', () => {
    it('ne crée qu’un seul versement pour une clé rejouée', async () => {
      const first = await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 5_000, method: 'MOBILE_MONEY' },
        'same-key',
      );
      const second = await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 5_000, method: 'MOBILE_MONEY' },
        'same-key',
      );

      expect(second.savedAmount.amount).toBe(first.savedAmount.amount);
      // Un seul versement a réellement été écrit.
      expect(prisma.state.payments).toHaveLength(1);
    });

    it('refuse de réutiliser la même clé pour un montant différent', async () => {
      await service.makePayment(
        USER_ID,
        SAVINGS_ID,
        { amount: 5_000, method: 'MOBILE_MONEY' },
        'conflict-key',
      );

      await expect(
        service.makePayment(
          USER_ID,
          SAVINGS_ID,
          { amount: 9_000, method: 'MOBILE_MONEY' },
          'conflict-key',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getSavings — cloisonnement', () => {
    it('refuse l’accès à une épargne d’un autre utilisateur', async () => {
      prisma.state.savings = makeSavings({ userId: 'someone-else' });
      await expect(service.getSavings(USER_ID, SAVINGS_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('expose les règles métier d’échec lorsque l’épargne a échoué', async () => {
      prisma.state.savings = makeSavings({ status: 'FAILED' });
      const result = await service.getSavings(USER_ID, SAVINGS_ID);

      expect(result.penaltyPercent).toBe(15);
      expect(result.refundPercent).toBe(85);
    });

    it('n’expose aucune pénalité tant que l’épargne se déroule normalement', async () => {
      const result = await service.getSavings(USER_ID, SAVINGS_ID);

      expect(result.penaltyPercent).toBeNull();
      expect(result.refundPercent).toBeNull();
    });

    it('expose l’extension maximale autorisée (2 mois)', async () => {
      const result = await service.getSavings(USER_ID, SAVINGS_ID);
      expect(result.maxExtensionMonths).toBe(2);
    });
  });
});
