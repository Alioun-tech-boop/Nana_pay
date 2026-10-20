// src/credit/credit.config.spec.ts
import {
  DEFAULT_CREDIT_CONFIG,
  computeTotalRepayment,
  interestRateBpsForTerm,
} from './credit.config';

/**
 * Barème du crédit bancaire.
 *
 * Ces règles sont **provisoires** mais elles ne sont pas arbitraires : elles
 * doivent rester cohérentes (jamais 0 %, jamais de taux négatif, arrondi
 * favorable à la banque) et surtout vérifiables (`credit.config.ts`).
 */

describe('interestRateBpsForTerm', () => {
  it('applique la tranche correspondant à la durée', () => {
    expect(interestRateBpsForTerm(3)).toBe(500);
    expect(interestRateBpsForTerm(6)).toBe(500);
    expect(interestRateBpsForTerm(7)).toBe(700);
    expect(interestRateBpsForTerm(12)).toBe(700);
    expect(interestRateBpsForTerm(18)).toBe(900);
    expect(interestRateBpsForTerm(24)).toBe(1100);
  });

  it('ne renvoie jamais 0 % hors barème : un crédit gratuit serait une erreur', () => {
    expect(interestRateBpsForTerm(0)).toBe(500);
    expect(interestRateBpsForTerm(120)).toBe(DEFAULT_CREDIT_CONFIG.fallbackInterestRateBps);
    expect(interestRateBpsForTerm(999)).toBeGreaterThan(0);
  });
});

describe('computeTotalRepayment', () => {
  it('ajoute des intérêts simples au principal', () => {
    // 100 000 × 5,00 % × 6/12 mois = 2 500 -> 102 500
    expect(computeTotalRepayment(100_000n, 6, 500)).toBe(102_500n);
  });

  it('calcule sur 12 mois', () => {
    // 100 000 × 7,00 % × 1 an = 7 000 -> 107 000
    expect(computeTotalRepayment(100_000n, 12, 700)).toBe(107_000n);
  });

  it('arrondit au supérieur, jamais en faveur du client', () => {
    // 1 × 5,00 % × 1/12 = 0,0000416... -> 1 unité (arrondi haut)
    expect(computeTotalRepayment(1n, 1, 500)).toBe(2n);
  });

  it('renvoie 0 pour un principal nul ou négatif', () => {
    expect(computeTotalRepayment(0n, 12, 700)).toBe(0n);
    expect(computeTotalRepayment(-5n, 12, 700)).toBe(0n);
  });

  it('ne perd jamais d’unités : total >= principal', () => {
    const principal = 45_000n;
    expect(computeTotalRepayment(principal, 12, 700)).toBeGreaterThanOrEqual(principal);
  });
});

describe('DEFAULT_CREDIT_CONFIG', () => {
  it('borne les durées de façon exploitable', () => {
    expect(DEFAULT_CREDIT_CONFIG.termMonths.min).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_CREDIT_CONFIG.termMonths.max).toBeGreaterThan(
      DEFAULT_CREDIT_CONFIG.termMonths.min,
    );
    expect(DEFAULT_CREDIT_CONFIG.termMonths.default).toBeGreaterThanOrEqual(
      DEFAULT_CREDIT_CONFIG.termMonths.min,
    );
    expect(DEFAULT_CREDIT_CONFIG.termMonths.default).toBeLessThanOrEqual(
      DEFAULT_CREDIT_CONFIG.termMonths.max,
    );
  });

  it('ne demande pas de contrôle sur une donnée absente du schéma', () => {
    // Le schéma ne stocke ni salaire ni ancienneté : activer ce contrôle
    // rendrait tout le monde inéligible silencieusement.
    expect(DEFAULT_CREDIT_CONFIG.eligibility.requiresVerifiedSalary).toBe(false);
    expect(DEFAULT_CREDIT_CONFIG.eligibility.minMonthlySalary).toBeNull();
  });
});
