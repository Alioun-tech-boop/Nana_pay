// src/auth/dto/login.dto.ts
import { z } from 'zod';

/**
 * Contrat API-CONTRACT.md §3 : `{ identifier, password }`.
 * `identifier` = email OU numero de telephone (compte unique).
 * `email` reste accepte par compatibilite avec d'anciens clients.
 */
export const LoginDtoSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Identifiant invalide.').max(254).optional(),
    email: z.string().trim().min(3).max(254).optional(),
    password: z.string().min(8, 'Mot de passe trop court.').max(128),
    mfaCode: z.string().length(6, 'Code a 6 chiffres attendu.').optional(),
    deviceFingerprint: z.string().max(256).optional(),
  })
  .refine((value) => Boolean(value.identifier ?? value.email), {
    message: 'Identifiant manquant.',
    path: ['identifier'],
  });

export type LoginDto = z.infer<typeof LoginDtoSchema>;
