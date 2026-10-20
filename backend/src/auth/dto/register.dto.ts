// src/auth/dto/register.dto.ts
import { z } from 'zod';

/**
 * Le frontend envoie `contact` + `contactType` et laisse l'autre champ vide
 * (`email: ''` pour une inscription par telephone). On normalise en aval :
 * un champ vide n'est PAS un champ fourni.
 *
 * Mot de passe : minimum 8 caracteres (UI d'inscription + NIST SP 800-63B).
 */
const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const RegisterDtoSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Prenom requis.').max(64),
    lastName: z.string().trim().min(1, 'Nom requis.').max(64),
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

    return { ...value, contact, email, phone };
  })
  .refine((value) => Boolean(value.email ?? value.phone), {
    message: 'Un email ou un numero de telephone est requis.',
    path: ['contact'],
  });

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
