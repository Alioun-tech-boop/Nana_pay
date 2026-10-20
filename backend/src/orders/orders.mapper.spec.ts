// src/orders/orders.mapper.spec.ts
import { toOrderDto, type OrderWithRelations } from './orders.mapper';

/**
 * Lien commande → financement.
 *
 * Une commande doit toujours exposer le financement qui la porte, quel que
 * soit le mode (`AGENTS.md` §7). Sans cette garantie, une commande financée par
 * le coffre s'afficherait comme « non financée » alors que le débit a bien eu
 * lieu — c'est exactement le défaut que ce test verrouille.
 */

const CURRENCY = 'XOF';

function makeOrder(overrides: Partial<OrderWithRelations> = {}): OrderWithRelations {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'ord-1',
    reference: 'NP-2026-00001245',
    userId: 'user-1',
    merchantId: 'merchant-1',
    productId: 'product-1',
    quantity: 1,
    totalPrice: 90_000n,
    currency: CURRENCY,
    financingMode: 'VAULT',
    status: 'FINANCED',
    createdAt: now,
    updatedAt: now,
    user: { id: 'user-1', firstName: 'Awa', lastName: 'Diallo' },
    merchant: { id: 'merchant-1', storeName: 'Chez Awa' },
    product: { id: 'product-1', name: 'Pagne wax', price: 45_000n, currency: CURRENCY },
    payments: [],
    savings: null,
    vaultUsage: null,
    ...overrides,
  } as OrderWithRelations;
}

describe('orders.mapper — lien vers le financement', () => {
  it('n’expose aucun financement tant que la commande n’est pas financée', () => {
    const dto = toOrderDto(makeOrder());
    expect(dto.financing).toBeNull();
  });

  it('relie une commande financée par épargne à son épargne', () => {
    const dto = toOrderDto(
      makeOrder({
        financingMode: 'SAVINGS',
        savings: { id: 'sav-1', status: 'IN_PROGRESS', savedAmount: 20_000n, currency: CURRENCY },
      }),
    );

    expect(dto.financing).toEqual({
      id: 'sav-1',
      status: 'IN_PROGRESS',
      amount: { amount: 20_000, currency: CURRENCY },
    });
  });

  it('relie une commande financée par le coffre à son usage', () => {
    const dto = toOrderDto(
      makeOrder({
        vaultUsage: {
          id: 'usage-1',
          amount: 90_000n,
          usedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      }),
    );

    // Le coffre n'a pas de statut propre : un usage vaut financement complet.
    expect(dto.financing).toEqual({
      id: 'usage-1',
      status: 'FINANCED',
      amount: { amount: 90_000, currency: CURRENCY },
    });
  });

  it('privilégie l’épargne si les deux existaient (cas anormal)', () => {
    // Une commande ne devrait jamais porter deux financements : si cela arrive,
    // on préfère l'épargne, qui porte un statut explicite, plutôt que d'afficher
    // un état ambigu.
    const dto = toOrderDto(
      makeOrder({
        savings: { id: 'sav-1', status: 'IN_PROGRESS', savedAmount: 20_000n, currency: CURRENCY },
        vaultUsage: {
          id: 'usage-1',
          amount: 90_000n,
          usedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      }),
    );

    expect(dto.financing?.id).toBe('sav-1');
  });

  it('expose le total autoritaire lu en base', () => {
    const dto = toOrderDto(makeOrder({ quantity: 2, totalPrice: 90_000n }));
    expect(dto.totalPrice).toEqual({ amount: 90_000, currency: CURRENCY });
    expect(dto.quantity).toBe(2);
  });
});
