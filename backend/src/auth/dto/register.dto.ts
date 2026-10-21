// src/auth/dto/register.dto.ts
import { z } from 'zod';

/**
 * Le frontend envoie `contact` + `contactType` et laisse l'autre champ vide
 * (`email: ''` pour une inscription par telephone). On normalise en aval :
 * un champ vide n'est PAS un champ fourni.
 *
 * Inscription simplifiee : seuls l'email/telephone et le mot de passe sont
 * exiges. `firstName` / `lastName` sont desormais OPTIONNELS (le profil peut
 * etre complete plus tard). Ils sont normalises vers une chaine vide, jamais
 * vers `undefined`, car les colonnes Prisma sont NOT NULL.
 *
 * Mot de passe : minimum 8 caracteres (UI d'inscription + NIST SP 800-63B).
 */
const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

/** Chaine vide par defaut : `firstName`/`lastName` sont NOT NULL en base. */
const emptyToString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export const RegisterDtoSchema = z
  .object({
    firstName: z.string().trim().max(64).optional(),
    lastName: z.string().trim().max(64).optional(),
    fullName: z.string().trim().max(129).optional(),
    birthDate: z.string().trim().max(32).optional(),
    contact: z.string().trim().max(254).optional(),
    contactType: z.enum(['email', 'phone']).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(32).optional(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(128),
  })
  .transform((value) => {
    const contact = emptyToUndefined(value.contact);
    const email =
      emptyToUndefined(value.email) ??
      (value.contactType === 'email' ? contact : undefined);
    const phone =
      emptyToUndefined(value.phone) ??
      (value.contactType === 'phone' ? contact : undefined);

    return {
      ...value,
      contact,
      email,
      phone,
      firstName: emptyToString(value.firstName),
      lastName: emptyToString(value.lastName),
    };
  })
  .refine((value) => Boolean(value.email ?? value.phone), {
    message: 'Un email ou un numero de telephone est requis.',
    path: ['contact'],
  });

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
