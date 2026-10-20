// src/vault/vault.mapper.spec.ts
import { TransactionType } from '@prisma/client';
import {
  computeRemaining,
  computeVaultProgress,
  toDirection,
  toVaultDto,
  toVaultTransactionDto,
} from './vault.mapper';

/**
 * Projection des mouvements du coffre.
 *
 * Le sens affiché (crédit/débit) est décidé par le backend : le frontend ne
 * doit jamais interpréter lui-même la liste des `TransactionType`
 * (`AGENTS.md` §10).
 */
describe('vault.mapper', () => {
  describe('toDirection', () => {
    it('projette CREDIT en crédit', () => {
      expect(toDirection(TransactionType.CREDIT)).toBe('CREDIT');
    });

    it('projette un débit en débit', () => {
      expect(toDirection(TransactionType.DEBIT)).toBe('DEBIT');
    });

    it('traite tout autre type comme un débit (choix conservateur)', () => {
      // TRANSFER / REFUND / FEE / PENALTY ne sont pas des entrées du coffre :
      // les présenter comme un crédit ferait croire à un solde qui n’existe pas.
      for (const type of [
        TransactionType.TRANSFER,
        TransactionType.REFUND,
        TransactionType.FEE,
        TransactionType.PENALTY,
      ]) {
        expect(toDirection(type)).toBe('DEBIT');
      }
    });
  });

  describe('toVaultTransactionDto', () => {
    it('expose le montant, la référence de commande et la date', () => {
      const createdAt = new Date('2026-03-01T10:00:00.000Z');
      const dto = toVaultTransactionDto({
        id: 'vtx-1',
        vaultId: 'vault-1',
        type: TransactionType.DEBIT,
        amount: 90_000n,
        currency: 'XOF',
        balanceAfter: 160_000n,
        reference: 'NP-2026-00001245',
        description: null,
        createdAt,
      });

      expect(dto).toEqual({
        id: 'vtx-1',
        direction: 'DEBIT',
        amount: { amount: 90_000, currency: 'XOF' },
        orderReference: 'NP-2026-00001245',
        createdAt: '2026-03-01T10:00:00.000Z',
      });
    });

    it('n’expose pas `balanceAfter` (une seule source de solde)', () => {
      const dto = toVaultTransactionDto({
        id: 'vtx-2',
        vaultId: 'vault-1',
        type: TransactionType.CREDIT,
        amount: 20_000n,
        currency: 'XOF',
        balanceAfter: 180_000n,
        reference: null,
        description: null,
        createdAt: new Date('2026-03-02T10:00:00.000Z'),
      });

      expect(dto).not.toHaveProperty('balanceAfter');
    });
  });

  describe('toVaultDto', () => {
    it('renvoie `null` pour un plan non défini, jamais zéro', () => {
      const dto = toVaultDto({
        id: 'vault-1',
        userId: 'user-1',
        balance: 0n,
        targetAmount: null,
        monthlyContribution: null,
        eligible: false,
        eligibilityCheckedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: { transactions: 0 },
      });

      // 0 signifierait « plan à zéro », ce qui est faux : aucun plan n’existe.
      expect(dto.targetAmount).toBeNull();
      expect(dto.monthlyContribution).toBeNull();
      expect(dto.progressPercent).toBeNull();
      expect(dto.remainingToTarget).toBeNull();
      expect(dto.transactionsCount).toBe(0);
    });

    it('calcule la progression à partir des montants serveur', () => {
      const dto = toVaultDto({
        id: 'vault-1',
        userId: 'user-1',
        balance: 250_000n,
        targetAmount: 500_000n,
        monthlyContribution: 20_000n,
        eligible: true,
        eligibilityCheckedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: { transactions: 0 },
      });

      // 250 000 / 500 000 = 50 %
      expect(dto.progressPercent).toBe(50);
      expect(dto.remainingToTarget).toEqual({ amount: 250_000, currency: 'XOF' });
    });
  });

  describe('computeVaultProgress / computeRemaining', () => {
    it('borne la progression à 100 quand le coffre dépasse la somme visée', () => {
      expect(computeVaultProgress(600_000n, 500_000n)).toBe(100);
    });

    it('ne renvoie jamais un reste à atteindre négatif', () => {
      expect(computeRemaining(600_000n, 500_000n, 'XOF')).toEqual({
        amount: 0,
        currency: 'XOF',
      });
    });

    it('renvoie `null` sans somme visée', () => {
      expect(computeVaultProgress(10_000n, null)).toBeNull();
      expect(computeRemaining(10_000n, null, 'XOF')).toBeNull();
    });
  });
});
