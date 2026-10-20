// src/vault/vault.mapper.ts
import { Prisma, TransactionType, Vault as PrismaVault, VaultTransaction as PrismaVaultTransaction } from '@prisma/client';
import { toMoney } from '../common/utils/money';
import { computeProgressPercent } from '../savings/savings.mapper';

/**
 * Sens d'un mouvement, tel qu'affiché par l'interface.
 *
 * Le modèle ne stocke pas de « sens » : il stocke un `TransactionType` métier
 * (`CREDIT`, `DEBIT`, `TRANSFER`, `REFUND`, `FEE`, `PENALTY`). Le sens affiché
 * est une **projection de lecture** décidée par le backend, pas une donnée
 * dupliquée en base : un `TRANSFER` ou un `FEE` augmentent ou diminuent le solde,
 * et le frontend ne doit jamais avoir à interpréter lui-même cette liste
 * (`AGENTS.md` §10).
 */
export type VaultTransactionDirection = 'CREDIT' | 'DEBIT';

export interface VaultTransactionDto {
  id: string;
  direction: VaultTransactionDirection;
  amount: { amount: number; currency: string };
  orderReference: string | null;
  createdAt: string;
}

export interface VaultDto {
  id: string;
  balance: { amount: number; currency: string };
  /**
   * Éligibilité du client au coffre, **décidée par le backend** à partir du
   * profil bancaire (`CreditProfile`). Le frontend ne la calcule jamais et ne
   * peut pas la contourner : c'est un mécanisme de financement réservé.
   */
  eligible: boolean;
  targetAmount: { amount: number; currency: string } | null;
  monthlyContribution: { amount: number; currency: string } | null;
  /**
   * Progression vers la somme visée, en pourcentage, **calculée par le
   * backend** — comme pour l'épargne progressive. `null` si aucun plan n'est
   * défini : il n'y a alors pas de progression à afficher.
   */
  progressPercent: number | null;
  /**
   * Reste à atteindre depuis le solde courant.
   *
   * `null` si aucune somme visée n'est définie. Vaut `0` (jamais négatif) si la
   * somme visée est atteinte : le coffre peut dépasser son objectif si le plan
   * a été modifié après coup.
   */
  remainingToTarget: { amount: number; currency: string } | null;
  transactionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export const VAULT_INCLUDE = {
  _count: { select: { transactions: true } },
} satisfies Prisma.VaultInclude;

export type VaultWithRelations = Prisma.VaultGetPayload<{ include: typeof VAULT_INCLUDE }>;

/**
 * Devise du coffre.
 *
 * Le modèle `Vault` ne stocke pas de devise : le solde est un BigInt nu. La
 * devise est donc portée par les mouvements (`VaultTransaction.currency`) et,
 * à défaut, par la monnaie de la plateforme. XOF est la devise de référence de
 * NanaPay (`AGENTS.md` §11).
 */
export const VAULT_DEFAULT_CURRENCY = 'XOF';

/**
 * Projection du sens d'affichage depuis le type métier.
 *
 * Seul `CREDIT` alimente le coffre ; tout le reste le débite (`DEBIT`,
 * `TRANSFER`, `REFUND`, `FEE`, `PENALTY`). Un type inconnu est traité comme un
 * débit : c'est le choix conservateur — mieux vaut sous-estimer un solde
 * affiché que de laisser croire à un crédit qui n'a pas eu lieu.
 */
export function toDirection(type: TransactionType): VaultTransactionDirection {
  return type === TransactionType.CREDIT ? 'CREDIT' : 'DEBIT';
}

export function toVaultTransactionDto(
  transaction: PrismaVaultTransaction,
): VaultTransactionDto {
  return {
    id: transaction.id,
    direction: toDirection(transaction.type),
    // `balanceAfter` n'est pas exposé : l'historique affiche le montant du
    // mouvement, le solde courant vient de `GET /vault`. Deux sources de solde
    // dans la même écran seraient une invitation à la divergence.
    amount: toMoney(transaction.amount, transaction.currency) as {
      amount: number;
      currency: string;
    },
    orderReference: transaction.reference,
    createdAt: transaction.createdAt.toISOString(),
  };
}

export function toVaultDto(vault: VaultWithRelations, currency = VAULT_DEFAULT_CURRENCY): VaultDto {
  return {
    id: vault.id,
    balance: toMoney(vault.balance, currency) as { amount: number; currency: string },
    eligible: vault.eligible,
    targetAmount: toMoney(vault.targetAmount, currency),
    monthlyContribution: toMoney(vault.monthlyContribution, currency),
    progressPercent: computeVaultProgress(vault.balance, vault.targetAmount),
    remainingToTarget: computeRemaining(vault.balance, vault.targetAmount, currency),
    // Compté en base, jamais estimé : c'est la source de vérité du nombre de
    // mouvements, y compris au-delà de la page affichée.
    transactionsCount: vault._count.transactions,
    createdAt: vault.createdAt.toISOString(),
    updatedAt: vault.updatedAt.toISOString(),
  };
}

/** Type minimal d'un coffre créé sans ses relations. */
export function toVaultDtoFromCreation(
  vault: PrismaVault,
  transactionsCount: number,
  currency = VAULT_DEFAULT_CURRENCY,
): VaultDto {
  return {
    id: vault.id,
    balance: toMoney(vault.balance, currency) as { amount: number; currency: string },
    eligible: vault.eligible,
    targetAmount: toMoney(vault.targetAmount, currency),
    monthlyContribution: toMoney(vault.monthlyContribution, currency),
    progressPercent: computeVaultProgress(vault.balance, vault.targetAmount),
    remainingToTarget: computeRemaining(vault.balance, vault.targetAmount, currency),
    transactionsCount,
    createdAt: vault.createdAt.toISOString(),
    updatedAt: vault.updatedAt.toISOString(),
  };
}

/**
 * Progression du coffre vers la somme visée, bornée 0–100.
 *
 * Règle identique à l'épargne progressive (`savings.mapper.ts`) : on réutilise
 * la même fonction plutôt que d'en écrire une seconde, pour qu'une correction
 * de la règle ne s'applique pas à un seul des deux financements. Sans somme
 * visée, il n'y a pas de progression possible : on renvoie `null` et non `0`,
 * car `0 %` décrirait un plan existant mais vide.
 */
export function computeVaultProgress(balance: bigint, target: bigint | null): number | null {
  if (target === null) return null;
  return computeProgressPercent(balance, target);
}

/**
 * Reste à atteindre depuis le solde courant.
 *
 * Borné à zéro : un coffre peut dépasser sa somme visée (plan modifié après
 * coup, ou solde hérité), et un « reste à atteindre » négatif n'aurait aucun
 * sens à l'écran.
 */
export function computeRemaining(
  balance: bigint,
  target: bigint | null,
  currency: string,
): { amount: number; currency: string } | null {
  if (target === null) return null;
  const remaining = target - balance;
  return toMoney(remaining > 0n ? remaining : 0n, currency);
}
