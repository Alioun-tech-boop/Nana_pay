// src/common/utils/idempotency.ts
import { BadRequestException } from '@nestjs/common';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;
const SAFE_CHARSET = /^[A-Za-z0-9._:-]+$/;

/**
 * Lit et valide l'en-tête `Idempotency-Key`.
 * Une opération financière ne doit jamais être rejouée à l'aveugle : la clé est
 * obligatoire sur toute création de ressource monétaire (commande, paiement...).
 */
export function requireIdempotencyKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: "En-tête 'Idempotency-Key' manquant.",
      field: 'Idempotency-Key',
    });
  }

  const key = value.trim();

  if (key.length < MIN_LENGTH) {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_INVALID',
      message: `La clé d'idempotence doit contenir au moins ${MIN_LENGTH} caractères.`,
      field: 'Idempotency-Key',
    });
  }

  if (key.length > MAX_LENGTH || !SAFE_CHARSET.test(key)) {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_INVALID',
      message: "La clé d'idempotence contient des caractères non autorisés.",
      field: 'Idempotency-Key',
    });
  }

  return key;
}
