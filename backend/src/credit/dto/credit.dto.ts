// src/credit/dto/credit.dto.ts
import { z } from 'zod';
import { CreditStatus as PrismaCreditStatus } from '@prisma/client';
import { DEFAULT_CREDIT_CONFIG } from '../credit.config';

/**
 * Énumérations issues de la base (`schema.prisma`) : la base est la source de
 * vérité du cycle de vie, le frontend n'en définit jamais la liste
 * (`AGENTS.md` §13, §17).
 */
export const CREDIT_DB_STATUSES = Object.values(PrismaCreditStatus) as [
  PrismaCreditStatus,
  ...PrismaCreditStatus[],
];
export type CreditDbStatus = PrismaCreditStatus;

/** Durées acceptées, exposées au frontend pour affichage. */
export const CREDIT_TERM_MIN = DEFAULT_CREDIT_CONFIG.termMonths.min;
export const CREDIT_TERM_MAX = DEFAULT_CREDIT_CONFIG.termMonths.max;

export const requestCreditSchema = z.object({
  orderId: z.string().uuid({ message: 'Identifiant de commande invalide.' }),
  termMonths: z.coerce
    .number({ message: 'Durée invalide.' })
    .int({ message: 'La durée doit être un nombre entier de mois.' })
    .min(CREDIT_TERM_MIN, { message: `La durée minimale est de ${CREDIT_TERM_MIN} mois.` })
    .max(CREDIT_TERM_MAX, { message: `La durée maximale est de ${CREDIT_TERM_MAX} mois.` })
    .default(DEFAULT_CREDIT_CONFIG.termMonths.default),
});

export type RequestCreditInput = z.infer<typeof requestCreditSchema>;

export const listCreditRequestsQuerySchema = z.object({
  page: z.coerce.number({ message: 'Page invalide.' }).int({ message: 'Page invalide.' }).min(1).optional(),
  pageSize: z.coerce
    .number({ message: 'Taille de page invalide.' })
    .int({ message: 'Taille de page invalide.' })
    .min(1)
    .max(100)
    .optional(),
  // Filtre sur les statuts **du contrat**, traduits en statuts base par le
  // service : l'API parle le langage de l'interface, pas celui de la table.
  status: z
    .enum(['IN_REVIEW', 'APPROVED', 'REFUSED', 'CANCELLED'], {
      message: 'Statut de demande invalide.',
    })
    .optional(),
});

export type ListCreditRequestsQuery = z.infer<typeof listCreditRequestsQuerySchema>;
