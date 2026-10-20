// src/common/utils/money.ts
/**
 * Les montants sont stockés en unités mineures (BIGINT) et sont une vérité
 * backend : le frontend n'arbitre jamais un montant.
 * JSON ne sérialise pas les BigInt -> conversion explicite en number.
 */

export interface MoneyDto {
  amount: number;
  currency: string;
}

export function toMinorUnits(value: bigint | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'bigint' ? Number(value) : value;
}

/** Construit le DTO `Money` attendu par le frontend. */
export function toMoney(
  amount: bigint | number | null | undefined,
  currency: string | null | undefined,
): MoneyDto | null {
  const normalized = toMinorUnits(amount);
  if (normalized === null) return null;
  return { amount: normalized, currency: currency ?? 'XOF' };
}
