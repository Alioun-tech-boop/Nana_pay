// src/common/utils/hash.ts
import { createHash } from 'crypto';

/** SHA-256 hex d'un corps de requête, utilisé pour détecter un réutilisateur de clé. */
export function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}
