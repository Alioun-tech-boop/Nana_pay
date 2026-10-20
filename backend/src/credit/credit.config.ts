// src/credit/credit.config.ts
/**
 * Paramètres métier du crédit bancaire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 * Le contrat (`API-CONTRACT.md` §6.3) décrit les **endpoints** du crédit, mais
 * ne fixe **ni le barème de taux, ni les critères d'éligibilité, ni le montant
 * maximal**. Ces règles n'ont pas été fournies.
 *
 * Elles ne sont donc PAS inventées en dur dans le service : elles sont
 * regroupées ici, nommées, et documentées comme **valeurs par défaut
 * provisoires**. Le jour où la banque partenaire communique son barème réel, il
 * n'y a qu'un seul fichier à modifier — et aucun test métier ne dépend d'un
 * chiffre enfoui au milieu d'une transaction Prisma.
 *
 * Les règles ci-dessous sont visibles par le client (l'UI affiche le taux et la
 * raison d'inéligibilité), donc elles doivent rester compréhensibles.
 */

export interface CreditConfig {
  /** Durées de remboursement acceptées, en mois. Bornes incluses. */
  termMonths: { min: number; max: number; default: number };
  /**
   * Barème de taux annuel en **points de base** (500 = 5,00 %).
   *
   * Un taux « raisonnable » aujourd'hui sur le marché de l'UEMOA serait proche
   * de 12 %, ce qui est bien supérieur aux crédits de consommation européens.
   * On retient ici un barème volontairement sobre, dégressif avec la durée, et
   * surtout **explicite** : la banque le remplacera.
   */
  interestRateBpsByTermMonths: Array<{ maxMonths: number; bps: number }>;
  /** Taux appliqué si aucune tranche ne correspond (ne devrait pas arriver). */
  fallbackInterestRateBps: number;
  /**
   * Éligibilité : conditions minimales.
   *
   * Chaque condition est une **règle serveur** relue à chaque demande. Le
   * frontend affiche les raisons renvoyées ; il ne décide jamais.
   *
   * IMPORTANT : le schéma ne stocke **ni employeur, ni salaire, ni ancienneté**.
   * Les seules conditions réellement vérifiables aujourd'hui portent donc sur
   * le `CreditProfile` (validation bancaire, score). Les conditions salariales
   * sont déclarées ici mais **désactivées par défaut**, et documentées comme
   * nécessitant une évolution du schéma — plutôt que d'être simulées sur des
   * champs inexistants.
   */
  eligibility: {
    /** Le profil bancaire doit être validé par la banque. */
    requiresValidatedProfile: boolean;
    /**
     * Exige une vérification du salaire.
     *
     * FAUX par défaut : la donnée n'existe pas en base. Passer cette valeur à
     * `true` sans avoir ajouté le champ correspondant rendrait **tout le monde
     * inéligible** — un refus silencieux, pire qu'une absence de règle.
     */
    requiresVerifiedSalary: boolean;
    /** Score minimal (0–100). `null` = pas de seuil. */
    minScore: number | null;
    /** Montant minimal de salaire mensuel. `null` = pas de seuil. */
    minMonthlySalary: number | null;
  };
  /**
   * Montant maximal financable par un crédit.
   *
   * `null` = pas de plafond global : le montant est celui de la commande.
   * Une valeur en unités mineures permet de plafonner si la banque l'exige.
   */
  maxCreditAmount: number | null;
}

/**
 * Valeurs par défaut — **provisoires et documentées**.
 *
 * Toute modification ici change le comportement financier de la plateforme et
 * doit être signalée dans `API-CONTRACT.md`.
 */
export const DEFAULT_CREDIT_CONFIG: CreditConfig = {
  termMonths: { min: 3, max: 24, default: 12 },

  // Dégressif : plus la durée est longue, plus le taux est élevé (le risque
  // s'accroît), mais on plafonne pour éviter un taux dissuasif.
  interestRateBpsByTermMonths: [
    { maxMonths: 6, bps: 500 }, // 5,00 %
    { maxMonths: 12, bps: 700 }, // 7,00 %
    { maxMonths: 18, bps: 900 }, // 9,00 %
    { maxMonths: 24, bps: 1100 }, // 11,00 %
  ],
  fallbackInterestRateBps: 1100,

  eligibility: {
    // Seule condition réellement vérifiable aujourd'hui : le dossier a été
    // validé par la banque (CreditProfile.status = VALIDATED).
    requiresValidatedProfile: true,
    // Désactivé : aucun champ de salaire n'existe en base (voir plus haut).
    requiresVerifiedSalary: false,
    minScore: null,
    minMonthlySalary: null,
  },

  maxCreditAmount: null,
};

/**
 * Taux annuel (points de base) pour une durée donnée.
 *
 * Fonction pure : elle est testée directement et ne dépend d'aucune donnée en
 * base. Une durée hors barème reçoit le taux de repli, jamais 0 % (un crédit
 * gratuit serait une erreur dangereuse à afficher).
 */
export function interestRateBpsForTerm(
  termMonths: number,
  config: CreditConfig = DEFAULT_CREDIT_CONFIG,
): number {
  const tranche = config.interestRateBpsByTermMonths.find((t) => termMonths <= t.maxMonths);
  return tranche ? tranche.bps : config.fallbackInterestRateBps;
}

/**
 * Montant total à rembourser : principal + intérêts simples sur la durée.
 *
 * Tous les calculs sont en **entiers** (unités mineures) : jamais de flottant
 * sur une valeur financière (`AGENTS.md` §11). L'arrondi est fait une seule
 * fois, à la fin, et vers le haut — l'arrondi favorable à la banque est le seul
 * qui ne crée pas de perte silencieuse.
 */
export function computeTotalRepayment(
  principal: bigint,
  termMonths: number,
  rateBps: number,
): bigint {
  if (principal <= 0n) return 0n;
  // intérêts = principal × taux × durée(années) = principal × bps × mois / (10000 × 12)
  const numerator = principal * BigInt(rateBps) * BigInt(termMonths);
  const denominator = 10_000n * 12n;
  // Arrondi au supérieur : (a + b - 1) / b pour des entiers positifs.
  const interest = (numerator + denominator - 1n) / denominator;
  return principal + interest;
}
