// src/vault/vault.service.spec.ts
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VaultService } from './vault.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Règles métier du Coffre NanaPay.
 *
 * Ces tests décrivent les garanties du BACKEND (`AGENTS.md` §9, §10, §14) :
 * le coffre est réservé aux clients éligibles, alimenté uniquement par le plan,
 * et jamais débité deux fois pour la même commande.
 */

const USER_ID = 'user-1';
const VAULT_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

interface VaultRow {
  id: string;
  userId: string;
  balance: bigint;
  targetAmount: bigint | null;
  monthlyContribution: bigint | null;
  eligible: boolean;
  eligibilityCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { transactions: number };
}

function makeVault(overrides: Partial<Omit<VaultRow, '_count'>> = {}, count = 0): VaultRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: VAULT_ID,
    userId: USER_ID,
    balance: 250_000n,
    targetAmount: 500_000n,
    monthlyContribution: 20_000n,
    eligible: true,
    eligibilityCheckedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
    _count: { transactions: count },
  };
}

interface OrderRow {
  id: string;
  reference: string;
  totalPrice: bigint;
  currency: string;
  financingMode: string;
  userId: string;
  vaultUsage: { id: string } | null;
}

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_ID,
    reference: 'NP-2026-00001245',
    totalPrice: 90_000n,
    currency: 'XOF',
    financingMode: 'VAULT',
    userId: USER_ID,
    vaultUsage: null,
    ...overrides,
  };
}

function createPrismaMock() {
  const state = {
    vault: makeVault(),
    order: makeOrder(),
    idempotency: new Map<string, { requestHash: string; responseBody: unknown }>(),
    transactions: [] as Array<Record<string, unknown>>,
    planHistory: [] as Array<Record<string, unknown>>,
    usages: [] as Array<Record<string, unknown>>,
    nextUpdatedAt: 1,
  };

  const tx = {
    vault: {
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.vault = { ...state.vault, ...(data as Partial<VaultRow>) };
        return state.vault;
      }),
      updateMany: jest.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          // Verrou optimiste : `updatedAt` doit correspondre à la version lue.
          if (
            where.updatedAt instanceof Date &&
            where.updatedAt.getTime() !== state.vault.updatedAt.getTime()
          ) {
            return { count: 0 };
          }
          state.nextUpdatedAt += 1;
          state.vault = {
            ...state.vault,
            balance: data.balance as bigint,
            updatedAt: new Date(state.nextUpdatedAt),
          };
          return { count: 1 };
        },
      ),
      findUniqueOrThrow: jest.fn(async () => state.vault),
    },
    vaultPlanHistory: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.planHistory.push(data);
        return data;
      }),
    },
    vaultUsage: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.usages.push(data);
        state.order = { ...state.order, vaultUsage: { id: 'usage-1' } };
        return data;
      }),
    },
    vaultTransaction: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.transactions.push(data);
        state.vault._count.transactions += 1;
        return data;
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
    vault: {
      findUnique: jest.fn(async ({ where }: { where: { userId?: string; id?: string } }) =>
        where.userId === state.vault.userId || where.id === state.vault.id ? state.vault : null,
      ),
      findUniqueOrThrow: jest.fn(async () => state.vault),
      create: jest.fn(async ({ data }: { data: { userId: string } }) => {
        const created = makeVault({ userId: data.userId, balance: 0n, targetAmount: null, monthlyContribution: null, eligible: false });
        state.vault = created;
        return created;
      }),
    },
    order: {
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; userId: string } }) =>
          where.id === state.order.id && where.userId === state.order.userId
            ? state.order
            : null,
      ),
    },
    vaultTransaction: {
      findMany: jest.fn(async () => state.transactions),
      findFirst: jest.fn(async () => state.transactions[state.transactions.length - 1] ?? null),
      count: jest.fn(async () => state.transactions.length),
    },
    idempotencyRecord: {
      findUnique: jest.fn(
        async ({ where }: { where: { key_endpoint_userId: { key: string; endpoint: string } } }) => {
          const found = state.idempotency.get(
            `${where.key_endpoint_userId.key}|${where.key_endpoint_userId.endpoint}`,
          );
          return found ?? null;
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

describe('VaultService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: VaultService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new VaultService(prisma);
  });

  describe('getVault — création et cloisonnement', () => {
    it('renvoie le coffre existant avec son solde autoritaire', async () => {
      const vault = await service.getVault(USER_ID);
      expect(vault.balance.amount).toBe(250_000);
      expect(vault.eligible).toBe(true);
    });

    it('compte les mouvements en base, pas depuis la page affichée', async () => {
      prisma.state.vault._count.transactions = 7;
      const vault = await service.getVault(USER_ID);
      expect(vault.transactionsCount).toBe(7);
    });

    it('crée un coffre vide non éligible au premier accès', async () => {
      prisma.state.vault = makeVault({ userId: 'someone-else' });
      const vault = await service.getVault(USER_ID);
      expect(vault.balance.amount).toBe(0);
      expect(vault.eligible).toBe(false);
      expect(vault.targetAmount).toBeNull();
    });
  });

  describe('configurePlan — éligibilité', () => {
    it('refuse la définition d’un plan à un client non éligible', async () => {
      prisma.state.vault = makeVault({ eligible: false });
      await expect(
        service.configurePlan(USER_ID, { monthlyAmount: 20_000, targetAmount: 500_000 }, 'plan-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('enregistre le plan d’un client éligible', async () => {
      const vault = await service.configurePlan(
        USER_ID,
        { monthlyAmount: 15_000, targetAmount: 300_000 },
        'plan-2',
      );
      expect(vault.monthlyContribution?.amount).toBe(15_000);
      expect(vault.targetAmount?.amount).toBe(300_000);
    });

    it('trace chaque version du plan dans l’historique', async () => {
      await service.configurePlan(USER_ID, { monthlyAmount: 15_000, targetAmount: 300_000 }, 'plan-3');
      expect(prisma.state.planHistory).toHaveLength(1);
      expect(prisma.state.planHistory[0].monthlyAmount).toBe(15_000n);
    });

    it('refuse un prélèvement mensuel supérieur à la somme visée', async () => {
      await expect(
        service.configurePlan(USER_ID, { monthlyAmount: 600_000, targetAmount: 500_000 }, 'plan-4'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('useVault — financement d’une commande', () => {
    it('refuse une commande inexistante ou d’un autre utilisateur', async () => {
      await expect(
        service.useVault(USER_ID, { orderId: '33333333-3333-4333-8333-333333333333' }, 'use-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse une commande qui n’est pas financée par le coffre', async () => {
      prisma.state.order = makeOrder({ financingMode: 'SAVINGS' });
      await expect(
        service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-2'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('refuse un financement sans plan coffre défini', async () => {
      prisma.state.vault = makeVault({ targetAmount: null, monthlyContribution: null });
      await expect(
        service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-3'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('refuse un financement si le solde est insuffisant', async () => {
      prisma.state.vault = makeVault({ balance: 50_000n });
      // Commande à 90 000, coffre à 50 000.
      await expect(
        service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-4'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('refuse un client non éligible', async () => {
      prisma.state.vault = makeVault({ eligible: false });
      await expect(
        service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-5'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('débite le coffre du montant autoritaire de la commande', async () => {
      const vault = await service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-6');
      // 250 000 − 90 000
      expect(vault.balance.amount).toBe(160_000);
    });

    it('écrit un mouvement de débit référencé par la commande', async () => {
      await service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-7');
      expect(prisma.state.transactions).toHaveLength(1);
      expect(prisma.state.transactions[0].type).toBe('DEBIT');
      expect(prisma.state.transactions[0].reference).toBe('NP-2026-00001245');
    });

    it('ne débite qu’une fois une commande déjà financée', async () => {
      // La commande porte déjà un usage : on renvoie l’état, sans second débit.
      prisma.state.order = makeOrder({ vaultUsage: { id: 'usage-existing' } });
      const vault = await service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-8');

      expect(vault.balance.amount).toBe(250_000);
      expect(prisma.state.transactions).toHaveLength(0);
    });

    it('signale un conflit si le coffre a changé entre-temps', async () => {
      // Le service lit le coffre, puis écrit en croyant cette version encore
      // courante. On simule une écriture concurrente : entre la lecture et
      // l'écriture, la version en base a changé. Le débit doit être refusé
      // plutôt que d'écraser la modification concurrente.
      const readVersion = new Date('2026-01-01T00:00:00.000Z');
      const storedVersion = new Date('2026-06-01T00:00:00.000Z');

      // La lecture renvoie la version périmée…
      prisma.vault.findUnique = jest.fn(async () => ({
        ...prisma.state.vault,
        updatedAt: readVersion,
      })) as unknown as typeof prisma.vault.findUnique;
      // …alors que la base est déjà passée à une version plus récente.
      prisma.state.vault.updatedAt = storedVersion;

      await expect(
        service.useVault(USER_ID, { orderId: ORDER_ID }, 'use-9'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('useVault — idempotence', () => {
    it('ne débite qu’une seule fois pour une clé rejouée', async () => {
      const first = await service.useVault(USER_ID, { orderId: ORDER_ID }, 'same-key');
      const second = await service.useVault(USER_ID, { orderId: ORDER_ID }, 'same-key');

      expect(second.balance.amount).toBe(first.balance.amount);
      expect(prisma.state.transactions).toHaveLength(1);
    });

    it('refuse de réutiliser la même clé pour une autre commande', async () => {
      await service.useVault(USER_ID, { orderId: ORDER_ID }, 'conflict-key');

      prisma.state.order = makeOrder({
        id: '44444444-4444-4444-8444-444444444444',
        vaultUsage: null,
      });

      await expect(
        service.useVault(
          USER_ID,
          { orderId: '44444444-4444-4444-8444-444444444444' },
          'conflict-key',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
