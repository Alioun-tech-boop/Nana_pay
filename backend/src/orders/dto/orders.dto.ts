// src/orders/dto/orders.dto.ts
import { z } from 'zod';
import {
  FinancingMode as PrismaFinancingMode,
  OrderStatus as PrismaOrderStatus,
} from '@prisma/client';

/**
 * Les énumérations proviennent du client Prisma : la base est la source de
 * vérité du cycle de vie, le front n'en définit jamais la liste.
 */
export const FINANCING_MODES = Object.values(PrismaFinancingMode) as [
  PrismaFinancingMode,
  ...PrismaFinancingMode[],
];
export type FinancingMode = PrismaFinancingMode;

export const ORDER_STATUSES = Object.values(PrismaOrderStatus) as [
  PrismaOrderStatus,
  ...PrismaOrderStatus[],
];
export type OrderStatus = PrismaOrderStatus;

export const createOrderSchema = z.object({
  productId: z.string().uuid({ message: 'Identifiant de produit invalide.' }),
  financingMode: z.enum(FINANCING_MODES, {
    message: 'Mode de financement invalide (SAVINGS, VAULT ou CREDIT).',
  }),
  quantity: z.coerce
    .number({ message: 'Quantité invalide.' })
    .int({ message: 'La quantité doit être un nombre entier.' })
    .min(1, { message: 'La quantité doit être au moins 1.' })
    .max(99, { message: 'La quantité ne peut excéder 99.' })
    .default(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number({ message: 'Page invalide.' }).int({ message: 'Page invalide.' }).min(1).optional(),
  pageSize: z.coerce
    .number({ message: 'Taille de page invalide.' })
    .int({ message: 'Taille de page invalide.' })
    .min(1)
    .max(100)
    .optional(),
  status: z
    .enum(ORDER_STATUSES, { message: 'Statut de commande invalide.' })
    .optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
