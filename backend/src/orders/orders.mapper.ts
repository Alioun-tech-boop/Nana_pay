// src/orders/orders.mapper.ts
import { Payment as PrismaPayment, Prisma } from '@prisma/client';
import { toMoney } from '../common/utils/money';
import type { FinancingMode, OrderStatus } from './dto/orders.dto';

export interface OrderPaymentDto {
  id: string;
  reference: string;
  orderId: string;
  amount: { amount: number; currency: string };
  method: string;
  status: string;
  provider: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  reference: string;
  client: { id: string; fullName: string };
  merchant: { id: string; name: string };
  product: { id: string; name: string; price: { amount: number; currency: string } };
  financingMode: FinancingMode;
  /** Renseigné une fois le module de financement associé implémenté. */
  financing: { id: string; status: string; amount: { amount: number; currency: string } } | null;
  status: OrderStatus;
  payment: OrderPaymentDto | null;
  createdAt: string;
  updatedAt: string;
}

/** Requête d'inclusion partagée entre la création, la lecture et le listing. */
export const ORDER_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true } },
  merchant: { select: { id: true, storeName: true } },
  product: { select: { id: true, name: true, price: true, currency: true } },
  payments: { orderBy: { initiatedAt: 'desc' as const } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function toPaymentDto(payment: PrismaPayment): OrderPaymentDto {
  return {
    id: payment.id,
    // Pas de colonne `reference` : on s'appuie sur la référence fournisseur.
    reference: payment.providerRef ?? payment.id,
    orderId: payment.orderId ?? '',
    amount: toMoney(payment.amount, payment.currency) as { amount: number; currency: string },
    method: payment.method,
    status: payment.status,
    provider: payment.provider,
    confirmedAt: payment.confirmedAt ? payment.confirmedAt.toISOString() : null,
    createdAt: payment.initiatedAt.toISOString(),
  };
}

export function toOrderDto(order: OrderWithRelations): OrderDto {
  const payment = order.payments.length > 0 ? order.payments[0] : null;

  return {
    id: order.id,
    reference: order.reference,
    client: {
      id: order.user.id,
      fullName: `${order.user.firstName} ${order.user.lastName}`.trim(),
    },
    merchant: { id: order.merchant.id, name: order.merchant.storeName },
    product: {
      id: order.product.id,
      name: order.product.name,
      price: toMoney(order.product.price, order.product.currency) as {
        amount: number;
        currency: string;
      },
    },
    financingMode: order.financingMode,
    financing: null,
    status: order.status,
    payment: payment ? toPaymentDto(payment) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
