// src/common/utils/reference.ts
/**
 * Identifiant de commande lisible côté humain : NP-2026-00001245
 * L'unicité est garantie par la contrainte UNIQUE de la base ; en cas de
 * collision, le service rejette et retente avec la séquence suivante.
 */
export function buildOrderReference(year: number, sequence: number): string {
  return `NP-${year}-${String(sequence).padStart(8, '0')}`;
}

export function startOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

export function startOfNextYear(year: number): Date {
  return new Date(Date.UTC(year + 1, 0, 1));
}
