// src/savings/savings.mapper.ts
import { Prisma, Savings as PrismaSavings, SavingsPayment as PrismaSavingsPayment } from '@prisma/client';
import { toMoney } from '../common/utils/money';
import { MAX_EXTENSION_MONTHS } from './dto/savings.dto';

export interface SavingsPaymentDto {
  id: string;
  amount: { amount: number; currency: string };
  method: string;
  status: string;
  providerRef: string | null;
  paidAt: string;
}

export interface SavingsDto {
  id: string;
  orderId: string;
  orderReference: string;
  targetAmount: { amount: number; currency: string };
  savedAmount: { amount: number; currency: string };
  /**
   * Progression en pourcentage, calculée par le backend.
   * Le frontend l'affiche telle quelle et ne la recalcule jamais
   * (`AGENTS.md` §10).
   */
  progressPercent: number;
  /** Mois restants avant échéance. `null` si aucune échéance n'est fixée. */
  remainingMonths: number | null;
  monthlyTarget: { amount: number; currency: string } | null;
  maxExtensionMonths: number;
  /** Part remboursée en cas d'échec (85 %) — règle métier backend. */
  refundPercent: number | null;
  /** Pénalité appliquée en cas d'échec (15 %) — règle métier backend. */
  penaltyPercent: number | null;
  startedAt: string;
  deadline: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const SAVINGS_INCLUDE = {
  order: { select: { id: true, reference: true } },
} satisfies Prisma.SavingsInclude;

export type SavingsWithRelations = Prisma.SavingsGetPayload<{ include: typeof SAVINGS_INCLUDE }>;

/**
 * Progression bornée 0–100.
 *
 * Le calcul appartient au backend. On protège simplement la division par zéro
 * (objectif nul ou absent) : sans objectif, il n'y a pas de progression possible.
 */
export function computeProgressPercent(saved: bigint, target: bigint): number {
  if (target <= 0n) return 0;
  if (saved >= target) return 100;
  // Arrondi au plus proche, jamais au-dessus de 100.
  return Math.min(100, Math.round((Number(saved) * 100) / Number(target)));
}

/**
 * Mois restants avant l'échéance, arrondis au mois supérieur : un mois entamé
 * reste un mois à financer. `null` si aucune échéance n'est définie.
 */
export function computeRemainingMonths(deadline: Date | null, now = new Date()): number | null {
  if (!deadline) return null;
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
}

export function toSavingsPaymentDto(payment: PrismaSavingsPayment): SavingsPaymentDto {
  return {
    id: payment.id,
    amount: toMoney(payment.amount, payment.currency) as { amount: number; currency: string },
    method: payment.method,
    status: payment.status,
    providerRef: payment.providerRef,
    paidAt: payment.paidAt.toISOString(),
  };
}

export function toSavingsDto(savings: SavingsWithRelations): SavingsDto {
  const isFailed = savings.status === 'FAILED';
  const isCancelled = savings.status === 'CANCELLED';

  return {
    id: savings.id,
    orderId: savings.orderId,
    orderReference: savings.order.reference,
    targetAmount: toMoney(savings.targetAmount, savings.currency) as { amount: number; currency: string },
    savedAmount: toMoney(savings.savedAmount, savings.currency) as { amount: number; currency: string },
    progressPercent: computeProgressPercent(savings.savedAmount, savings.targetAmount),
    remainingMonths: computeRemainingMonths(savings.deadline),
    monthlyTarget: toMoney(savings.monthlyTarget, savings.currency),
    maxExtensionMonths: MAX_EXTENSION_MONTHS,
    // Les taux ne sont communiqués que lorsqu'ils s'appliquent réellement : ils
    // décrivent une conséquence financière (`AGENTS.md` §27).
    refundPercent: isFailed ? 85 : null,
    penaltyPercent: isFailed ? 15 : null,
    startedAt: savings.startedAt.toISOString(),
    deadline: savings.deadline ? savings.deadline.toISOString() : null,
    cancelledAt: savings.cancelledAt ? savings.cancelledAt.toISOString() : null,
    cancellationReason: isCancelled ? savings.cancellationReason : null,
    status: savings.status,
    createdAt: savings.createdAt.toISOString(),
    updatedAt: savings.updatedAt.toISOString(),
  };
}

/** Utilisé pour l'échéance par défaut : l'objectif est étalé sur N mois. */
export function addMonths(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}
