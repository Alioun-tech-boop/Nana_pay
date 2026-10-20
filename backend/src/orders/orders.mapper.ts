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
  /** Quantité commandée, telle qu'enregistrée par le backend. */
  quantity: number;
  /**
   * Total autoritaire (`prix × quantité`), calculé et stocké par le backend.
   *
   * Le frontend ne doit jamais le recalculer : il l'affiche tel quel
   * (`AGENTS.md` §10). Un total recalculé côté client pourrait diverger du
   * montant réellement financé.
   */
  totalPrice: { amount: number; currency: string };
  financingMode: FinancingMode;
  /**
   * Financement associé, lorsqu'il existe.
   *
   * Renseigné dès que l'épargne (ou le coffre/crédit) est créée : c'est le lien
   * entre la commande et son financement, que l'interface doit pouvoir montrer.
   */
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
  // Chaque mode de financement implémenté doit apparaître ici : sans cela une
  // commande financée par le coffre s'afficherait comme « non financée »
  // (`AGENTS.md` §7 : une commande reste reliée à son financement réel).
  savings: { select: { id: true, status: true, savedAmount: true, currency: true } },
  vaultUsage: { select: { id: true, amount: true, usedAt: true } },
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

  // Le financement reflète l'état réel enregistré : jamais une valeur inventée.
  // Deux modes sont implémentés aujourd'hui (épargne, coffre) ; chacun alimente
  // le même champ `financing` côté contrat.
  let financing: OrderDto['financing'] = null;

  if (order.savings !== null && order.savings !== undefined) {
    financing = {
      id: order.savings.id,
      status: order.savings.status,
      amount: toMoney(order.savings.savedAmount, order.savings.currency) as {
        amount: number;
        currency: string;
      },
    };
  } else if (order.vaultUsage !== null && order.vaultUsage !== undefined) {
    // Le coffre n'a pas de statut de financement propre : un usage signifie que
    // la commande a été financée en totalité, une fois pour toutes.
    financing = {
      id: order.vaultUsage.id,
      status: 'FINANCED',
      amount: toMoney(order.vaultUsage.amount, order.currency) as {
        amount: number;
        currency: string;
      },
    };
  }

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
    quantity: order.quantity,
    // Total autoritaire : lu en base, jamais recalculé ici ni côté client.
    totalPrice: toMoney(order.totalPrice, order.currency) as { amount: number; currency: string },
    financingMode: order.financingMode,
    financing,
    status: order.status,
    payment: payment ? toPaymentDto(payment) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
