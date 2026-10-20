// src/savings/dto/savings.dto.ts
import { z } from 'zod';
import {
  PaymentMethod as PrismaPaymentMethod,
  SavingsStatus as PrismaSavingsStatus,
} from '@prisma/client';

/**
 * Les énumérations viennent du client Prisma : la base est la source de vérité.
 * Le frontend n'en définit jamais la liste (`AGENTS.md` §13, §17).
 */
export const SAVINGS_STATUSES = Object.values(PrismaSavingsStatus) as [
  PrismaSavingsStatus,
  ...PrismaSavingsStatus[],
];
export type SavingsStatus = PrismaSavingsStatus;

/**
 * Moyens de versement acceptés pour l'épargne.
 *
 * Le contrat (`API-CONTRACT.md` §6.1) n'expose que ces deux moyens : un
 * versement d'épargne n'est ni un retrait ni un règlement commerçant.
 */
export const SAVINGS_PAYMENT_METHODS = [
  PrismaPaymentMethod.MOBILE_MONEY,
  PrismaPaymentMethod.CARD,
] as const;
export type SavingsPaymentMethod = (typeof SAVINGS_PAYMENT_METHODS)[number];

/**
 * Montant minimum d'un versement : 1 000 F CFA en unités mineures.
 * Valeur métier documentée — le backend la fait respecter, le front l'affiche.
 */
export const MIN_SAVINGS_PAYMENT = 1000;

/** Extension d'épargne : 2 mois maximum (`AGENTS.md` §12). */
export const MAX_EXTENSION_MONTHS = 2;

export const startSavingsSchema = z.object({
  orderId: z.string().uuid({ message: 'Identifiant de commande invalide.' }),
});

export type StartSavingsInput = z.infer<typeof startSavingsSchema>;

export const savingsPaymentSchema = z.object({
  amount: z.coerce
    .number({ message: 'Montant invalide.' })
    .int({ message: 'Le montant doit être un nombre entier (unités mineures).' })
    .positive({ message: 'Le montant doit être supérieur à zéro.' }),
  method: z.enum(SAVINGS_PAYMENT_METHODS, {
    message: 'Moyen de versement invalide (MOBILE_MONEY ou CARD).',
  }),
});

export type SavingsPaymentInput = z.infer<typeof savingsPaymentSchema>;

export const listSavingsQuerySchema = z.object({
  page: z.coerce.number({ message: 'Page invalide.' }).int({ message: 'Page invalide.' }).min(1).optional(),
  pageSize: z.coerce
    .number({ message: 'Taille de page invalide.' })
    .int({ message: 'Taille de page invalide.' })
    .min(1)
    .max(100)
    .optional(),
  status: z.enum(SAVINGS_STATUSES, { message: 'Statut d’épargne invalide.' }).optional(),
});

export type ListSavingsQuery = z.infer<typeof listSavingsQuerySchema>;

export const listSavingsHistoryQuerySchema = z.object({
  page: z.coerce.number({ message: 'Page invalide.' }).int({ message: 'Page invalide.' }).min(1).optional(),
  pageSize: z.coerce
    .number({ message: 'Taille de page invalide.' })
    .int({ message: 'Taille de page invalide.' })
    .min(1)
    .max(100)
    .optional(),
});

export type ListSavingsHistoryQuery = z.infer<typeof listSavingsHistoryQuerySchema>;
