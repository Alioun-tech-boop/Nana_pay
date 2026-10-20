// src/vault/dto/vault.dto.ts
import { z } from 'zod';

/**
 * Coffre NanaPay — validation d'entrée.
 *
 * Le contrat (`API-CONTRACT.md` §6.2) confie au **client** le choix du
 * prélèvement mensuel et de la somme visée, et au **backend** leur validation.
 * Aucune règle métier (éligibilité, plafond, montant maximal) n'est donc
 * appliquée ici : seules la forme et l'intégrité des entiers le sont.
 */

/**
 * Montant minimum d'un prélèvement ou d'une somme visée : 1 000 F CFA en unités
 * mineures.
 *
 * Le contrat parle d'entiers « > 0 » sans fixer de plancher. On retient le même
 * plancher que l'épargne progressive (1 000 F CFA, `savings.dto.ts`) plutôt que
 * d'inventer une seconde valeur métier : deux financements de nature proche ne
 * doivent pas afficher deux minimums différents. Cette constante est exposée au
 * frontend pour qu'il l'affiche ; elle n'est pas une décision du client.
 */
export const MIN_VAULT_AMOUNT = 1000;

/**
 * Montant entier en unités mineures, strictement positif.
 *
 * `z.coerce.number()` accepte aussi bien `20000` que `"20000"` : le frontend
 * envoie des nombres, mais une saisie de formulaire peut arriver en chaîne.
 */
const minorUnits = (label: string) =>
  z.coerce
    .number({ message: `Montant ${label} invalide.` })
    .int({ message: `Le montant ${label} doit être un nombre entier (unités mineures).` })
    .positive({ message: `Le montant ${label} doit être supérieur à zéro.` });

export const configureVaultPlanSchema = z.object({
  monthlyAmount: minorUnits('du prélèvement mensuel'),
  targetAmount: minorUnits('de la somme visée'),
});

export type ConfigureVaultPlanInput = z.infer<typeof configureVaultPlanSchema>;

export const useVaultSchema = z.object({
  orderId: z.string().uuid({ message: 'Identifiant de commande invalide.' }),
});

export type UseVaultInput = z.infer<typeof useVaultSchema>;

export const listVaultTransactionsQuerySchema = z.object({
  page: z.coerce.number({ message: 'Page invalide.' }).int({ message: 'Page invalide.' }).min(1).optional(),
  pageSize: z.coerce
    .number({ message: 'Taille de page invalide.' })
    .int({ message: 'Taille de page invalide.' })
    .min(1)
    .max(100)
    .optional(),
});

export type ListVaultTransactionsQuery = z.infer<typeof listVaultTransactionsQuerySchema>;
