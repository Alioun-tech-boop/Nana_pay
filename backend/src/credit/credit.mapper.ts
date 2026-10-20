// src/credit/credit.mapper.ts
import {
  Credit as PrismaCredit,
  CreditProfile as PrismaCreditProfile,
  CreditRequest as PrismaCreditRequest,
  Prisma,
} from '@prisma/client';
import { toMoney, MoneyDto } from '../common/utils/money';

/**
 * Statut de demande **côté contrat**.
 *
 * La table `CreditRequest` utilise `CreditStatus` (REQUESTED, UNDER_REVIEW,
 * APPROVED, REFUSED, DISBURSED, REPAYING, COMPLETED, DEFAULTED) qui décrit tout
 * le cycle de vie du crédit, du dépôt de la demande au remboursement.
 *
 * Le contrat (`API-CONTRACT.md` §6.3) et l'interface n'exposent, pour une
 * **demande**, que quatre états : `IN_REVIEW`, `APPROVED`, `REFUSED`,
 * `CANCELLED`. Le backend fait donc la traduction ; c'est le seul endroit où
 * elle existe, pour qu'aucun consommateur n'ait à connaître les deux vocabulaires.
 */
export type CreditRequestStatus = 'IN_REVIEW' | 'APPROVED' | 'REFUSED' | 'CANCELLED';

/**
 * Traduction statut base → statut contrat.
 *
 * `REQUESTED` et `UNDER_REVIEW` sont tous deux « en analyse » du point de vue du
 * client : la nuance (file d'attente / en cours d'examen) est interne à la
 * banque. Les états postérieurs à un accord (`DISBURSED`, `REPAYING`,
 * `COMPLETED`) restent `APPROVED` : la demande a été acceptée, et c'est le
 * **crédit** (`GET /credit`) qui porte l'état de remboursement. `DEFAULTED` ne
 * concerne pas la demande mais le crédit : on le rattache à `APPROVED`.
 */
export function toRequestStatus(status: string): CreditRequestStatus {
  switch (status) {
    case 'APPROVED':
    case 'DISBURSED':
    case 'REPAYING':
    case 'COMPLETED':
    case 'DEFAULTED':
      return 'APPROVED';
    case 'REFUSED':
      return 'REFUSED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REQUESTED':
    case 'UNDER_REVIEW':
    default:
      return 'IN_REVIEW';
  }
}

/** Statuts base correspondant à un filtre de contrat. */
export function toDbStatuses(status: CreditRequestStatus): string[] {
  switch (status) {
    case 'APPROVED':
      return ['APPROVED', 'DISBURSED', 'REPAYING', 'COMPLETED', 'DEFAULTED'];
    case 'REFUSED':
      return ['REFUSED'];
    case 'CANCELLED':
      return ['CANCELLED'];
    case 'IN_REVIEW':
    default:
      return ['REQUESTED', 'UNDER_REVIEW'];
  }
}

export interface EligibilityDto {
  eligible: boolean;
  /**
   * Raisons d'inéligibilité, en clair.
   *
   * Le frontend les affiche telles quelles. Elles sont **calculées par le
   * backend** à partir des données réelles du profil : jamais déduites côté
   * client (`AGENTS.md` §10, §19).
   */
  reasons: string[];
}

export interface CreditProfileDto {
  id: string;
  /**
   * Éligibilité globale du profil, telle que décidée par la banque.
   *
   * Dérivée de `status` et `validatedAt` — les seules informations de profil
   * réellement stockées. Le schéma ne contient **ni employeur, ni salaire, ni
   * ancienneté** : ces informations ne sont donc pas exposées, plutôt que
   * d'inventer un profil qui n'existe pas en base.
   */
  bankProfileValidated: boolean;
  /** Score calculé par la banque ; `null` tant qu'il ne l'est pas. */
  score: number | null;
  /** Montant maximal accordé par la banque ; `null` si non défini. */
  maxAmount: MoneyDto | null;
  status: string;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditRequestDto {
  id: string;
  orderId: string;
  orderReference: string;
  requestedAmount: MoneyDto;
  termMonths: number;
  /** Taux annuel en pourcentage, calculé par le backend (2 décimales). */
  ratePercent: number;
  /** Montant total à rembourser, calculé par le backend. */
  totalRepayment: MoneyDto;
  status: CreditRequestStatus;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditDto {
  id: string;
  reference: string;
  requestId: string;
  principal: MoneyDto;
  /** Restant dû, calculé par le backend à partir des remboursements réels. */
  remaining: MoneyDto;
  /** Taux annuel en pourcentage (2 décimales). */
  ratePercent: number;
  totalAmount: MoneyDto;
  termMonths: number;
  status: string;
  disbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CREDIT_REQUEST_INCLUDE = {
  order: { select: { id: true, reference: true } },
} satisfies Prisma.CreditRequestInclude;

export type CreditRequestWithRelations = Prisma.CreditRequestGetPayload<{
  include: typeof CREDIT_REQUEST_INCLUDE;
}>;

/** Points de base -> pourcentage affichable (500 -> 5). */
export function bpsToPercent(bps: number): number {
  return Math.round((bps / 100) * 100) / 100;
}

export function toEligibilityDto(eligible: boolean, reasons: string[]): EligibilityDto {
  // Une décision favorable ne porte pas de motif : afficher « éligible car… »
  // n'a aucune valeur et donnerait l'impression d'un score négociable.
  return { eligible, reasons: eligible ? [] : reasons };
}

export function toCreditProfileDto(profile: PrismaCreditProfile): CreditProfileDto {
  return {
    id: profile.id,
    bankProfileValidated: profile.status === 'VALIDATED' && profile.validatedAt !== null,
    score: profile.score,
    maxAmount: toMoney(profile.maxAmount, 'XOF'),
    status: profile.status,
    validatedAt: profile.validatedAt ? profile.validatedAt.toISOString() : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toCreditRequestDto(
  request: CreditRequestWithRelations,
  rateBps: number,
  totalRepayment: bigint,
): CreditRequestDto {
  return {
    id: request.id,
    orderId: request.orderId,
    orderReference: request.order.reference,
    requestedAmount: toMoney(request.amount, request.currency) as MoneyDto,
    termMonths: request.termMonths,
    ratePercent: bpsToPercent(rateBps),
    totalRepayment: toMoney(totalRepayment, request.currency) as MoneyDto,
    status: toRequestStatus(request.status),
    decisionReason: request.decisionReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

/**
 * Référence lisible d'un crédit : `CRD-AAAA-NNNNNNNNNN`.
 *
 * Dérivée de l'identifiant, donc stable et sans risque de collision entre deux
 * crédits : deux identifiants distincts donnent deux suites distinctes.
 */
export function creditReference(id: string): string {
  const digits = id.replace(/[^0-9a-f]/gi, '').slice(-10).toUpperCase();
  const year = new Date().getFullYear();
  return `CRD-${year}-${digits}`;
}

export function toCreditDto(credit: PrismaCredit, repaid: bigint): CreditDto {
  const remaining = credit.totalAmount - repaid;
  return {
    id: credit.id,
    reference: creditReference(credit.id),
    requestId: credit.requestId,
    principal: toMoney(credit.principal, 'XOF') as MoneyDto,
    remaining: toMoney(remaining > 0n ? remaining : 0n, 'XOF') as MoneyDto,
    ratePercent: bpsToPercent(credit.interestRate),
    totalAmount: toMoney(credit.totalAmount, 'XOF') as MoneyDto,
    termMonths: credit.termMonths,
    status: credit.status,
    disbursedAt: credit.disbursedAt ? credit.disbursedAt.toISOString() : null,
    createdAt: credit.createdAt.toISOString(),
    updatedAt: credit.updatedAt.toISOString(),
  };
}
