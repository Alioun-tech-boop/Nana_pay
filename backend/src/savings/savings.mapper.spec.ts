// src/savings/savings.mapper.spec.ts
import {
  addMonths,
  computeProgressPercent,
  computeRemainingMonths,
} from './savings.mapper';

/**
 * Ces calculs sont une vérité BACKEND (`AGENTS.md` §10) : le frontend affiche
 * `progressPercent` et `remainingMonths` tels quels, sans jamais les recalculer.
 * Les verrouiller ici protège l'interface d'une progression incohérente.
 */
describe('savings.mapper — calculs backend', () => {
  describe('computeProgressPercent', () => {
    it('renvoie 0 quand aucun objectif n’est défini', () => {
      expect(computeProgressPercent(0n, 0n)).toBe(0);
    });

    it('calcule une progression intermédiaire (85 000 / 250 000 = 34 %)', () => {
      expect(computeProgressPercent(85_000n, 250_000n)).toBe(34);
    });

    it('borne à 100 même si l’épargne dépasse l’objectif', () => {
      expect(computeProgressPercent(300_000n, 250_000n)).toBe(100);
    });

    it('renvoie exactement 100 à l’objectif atteint', () => {
      expect(computeProgressPercent(250_000n, 250_000n)).toBe(100);
    });

    it('renvoie 0 avant tout versement', () => {
      expect(computeProgressPercent(0n, 250_000n)).toBe(0);
    });

    it('ne perd pas de précision sur de gros montants', () => {
      expect(computeProgressPercent(1_000_000_000n, 2_000_000_000n)).toBe(50);
    });
  });

  describe('computeRemainingMonths', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    it('renvoie null sans échéance', () => {
      expect(computeRemainingMonths(null, now)).toBeNull();
    });

    it('renvoie 0 pour une échéance déjà dépassée', () => {
      expect(computeRemainingMonths(new Date('2025-12-01T00:00:00.000Z'), now)).toBe(0);
    });

    it('arrondit au mois supérieur : un mois entamé reste dû', () => {
      // ~6 mois plus tard
      expect(computeRemainingMonths(new Date('2026-07-01T00:00:00.000Z'), now)).toBe(6);
    });

    it('renvoie 1 pour une échéance dans quelques jours', () => {
      expect(computeRemainingMonths(new Date('2026-01-10T00:00:00.000Z'), now)).toBe(1);
    });
  });

  describe('addMonths', () => {
    it('décale la date du nombre de mois demandé', () => {
      expect(addMonths(new Date('2026-01-15T00:00:00.000Z'), 6).toISOString()).toBe(
        '2026-07-15T00:00:00.000Z',
      );
    });

    it('franchit correctement l’année', () => {
      expect(addMonths(new Date('2026-11-30T00:00:00.000Z'), 2).toISOString()).toBe(
        '2027-01-30T00:00:00.000Z',
      );
    });

    it('ne modifie pas la date d’origine', () => {
      const original = new Date('2026-01-15T00:00:00.000Z');
      addMonths(original, 3);
      expect(original.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });
  });
});
