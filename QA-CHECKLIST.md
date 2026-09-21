# NanoPay — Checklist de validation (QA)

> Version : 0.1 (PROPOSED)
> Usage : chaque release passe par ces contrôles avant livraison. À automatiser dans la CI dès que le code existe.
> Convention : ✅ à documenter au fur et à mesure des phases d'implémentation. Attention — les statuts font foi **seulement s'ils sont donnés par le backend** (jamais localement).
>
> **Statut d'implémentation (mock)** : les covérifications ci-dessous marquées ✅ sont vérifiées par **revue de code** sur l'implémentation mock actuelle (`typecheck` + `build` verts). Les contrôles qui exigent un backend réel, un couplage e2e ou des tests automatisés restent décochés.

---

## 1. États UX transverses

- [x] Chaque écran critique possède : `LOADING` (Skeleton contextualisé), `SUCCESS`, `ERROR` (InlineAlert + retry), `EMPTY` (EmptyState avec CTA).
- [x] Aucun état vague (« almost », « done-ish », « maybe »).
- [x] Pas de spinner plein écran si un Skeleton contextuel suffit.
- [x] Les messages d'erreur sont traduits/cumulables (code + title + detail), jamais de message technique brut.

## 2. Parcours Client

- [ ] Liste produits → détail produit → prix affiché via backend (`Amount`, tabular-nums).
- [ ] Création de commande : sélection mode financier (SAVINGS/VAULT/CREDIT), confirmation avec référence `NP-YYYY-NNNNNNNN` + montant + méthode.
- [ ] Épargne : cible, épargné, progression, échéance et extension (max 2 mois) — toutes valeurs backend.
- [ ] Versement Mobile Money : le succès d'interface **ne remplace jamais** la confirmation backend (asynchrone).
- [ ] Coffre : éligibilité affichée depuis le backend (jamais de wallet générique).
- [ ] Crédit : simulation marquée « indicative », demande liée à la commande, statut de décision backend.
- [ ] `QrDisplay` : rendu depuis payload backend, expiration, refresh, état.
- [ ] Retrait & livraison : statuts backend uniquement ; reçu après confirmation.
- [ ] Aucun montant/statut recalculé côté client.

## 3. Parcours Commerçant

- [x] File d'ordres financés prêts (statut backend).
- [x] Scan QR → envoi → décision backend affichée (valide/expiré/déjà scanné/mauvais commerçant).
- [x] Retrait confirmé avant tout règlement ; **aucun paiement automatique au simple scan**.
- [x] Règlement séparé (`MERCHANT_PAID`) après retrait confirmé, avec `Idempotency-Key`.
- [x] Solde/transactions : affichage seulement.

## 4. Parcours Banque

- [x] Dossier de demande : profil, documents, historique (pas de scoring frontend).
- [x] Décision `APPROVED` / `REFUSED` + motif → confirmé (statut propagé dans le dossier mock).
- [x] Supervision des règlements et commandes financées.
- [x] Pas de remplacement par l'Admin.

## 5. Parcours Admin

- [x] Supervision utilisateurs/commerçants/produits/commandes/paiements/crédits/QR/retraits/règlements/transactions.
- [ ] Validation commerçant (activation/suspension) — action non implémentée (liste seule).
- [x] Audit instrumenté (journal d'audit).

## 6. Tests de sécurité

- [x] Se remette au backend pour `401/403/404` (jamais de contournement).
- [x] Accès `/bank` interdit pour Client, `/merchant` interdit pour Admin, etc. (`RequireRole` — à revalider en e2e).
- [x] AUCUN jeton dans `localStorage`/`sessionStorage`.
- [x] Aucun secret dans le bundle (grep CI + revue PR) — aucun `dangerouslySetInnerHTML`.
- [x] Mutations d'argent : `ConfirmDialog` + `Idempotency-Key` + `disabled` pendant l'appel.
- [x] `X-Request-Id` sur les appels, logging non-sensitif.
- [x] Aucune requête croisée entre rôles (services séparés par rôle).

## 7. Tests financiers (règles critiques)

- [x] **Double clic sur « Confirmer le paiement/le retrait »** → une seule opération (UI disabled + idempotence).
- [x] **Refresh / retour navigateur** → l'état est re-fetché du backend (pas de reconstruction mémoire).
- [x] `QR expiré` → affiché comme tel (jamais comme valide), refresh proposé.
- [x] `QR déjà scanné / mauvais commerçant / mauvais montant` → erreur claire, aucune conclusion locale.
- [x] Paiement Mobile Money échoué → statut `FAILED`, pas de « confirmé ».
- [x] Épargne : pénalité/reste (15 %/85 %), extension de 2 mois — valeurs provenant du backend.
- [x] Fonds insuffisants (coffre) → rejet backend affiché proprement.
- [x] Crédit refusé → message générique revu, aucun détail sensible interne.

## 8. Robusness réseau & données

- [x] Network failure → message utilisateur (« Vérifiez votre connexion… ») + retry borné.
- [x] Backend 5xx → message générique, jamais `500 Internal Server Error`.
- [x] Empty states avec guidance + CTA.
- [x] 404 financier → « introuvable » sans révéler l'existence de la ressource.
- [x] Pagination, tri, filtre sur les listes.

## 9. Responsive

- [ ] Mobile (375 px), tablette (768 px), desktop (1280 px), large (1920 px) — sans overflow horizontal.
- [ ] Navigation (sidebar → drawer), modales, tables et QR utilisables sur mobile.
- [ ] Actions d'argent tactilement sûres (≥ 44 px).

## 10. Accessibilité

- [ ] Navigation clavier complète + focus visible partout.
- [ ] Landmarks sémantiques, hiérarchie de titres cohérente.
- [ ] Contraste ≥ 4,5:1 (texte) / ≥ 3:1 (composants).
- [ ] Erreurs annoncées (`aria-live`/`role="alert"`) et liées aux champs.
- [ ] Statuts = couleur + icône + libellé (jamais couleur seule).
- [ ] `prefers-reduced-motion` respecté.
- [ ] Montants lisibles par lecteur d'écran (devise incluse).

## 11. Performance

- [ ] Bundle initial gzip < 180 Ko (code-splitting par rôle).
- [ ] Pas de polling systématique ; invalidation de cache raisonnable.
- [ ] LCP < 2,5 s · INP < 200 ms · CLS < 0,1 (parcours critiques).
- [ ] Images AVIF/WebP responsives, lazy load.
- [ ] Pas de re-render/fetch inutile (profiled sur écrans lourds).

## 12. Outils & automatisation (CI proposée)

- [ ] `lint` + `typecheck` + `test` verts.
- [ ] e2e Playwright : parcours Client/Commerçant/Banque/Admin + QR + cloisonnement rôles.
- [ ] Audit de dépendances (zéro vuln critique).
- [ ] Recherche de secrets en CI.
- [ ] Lighthouse CI (perf ≥ 90, a11y = 100, best-practices ≥ 90).

---

## 13. Gate de sortie (release-ready)

- [ ] Tous les points ci-dessus validés ou documentés (avec maîtrise des exceptions).
- [ ] Aucun mock en production ; backend réel branché et contracté (`API-CONTRACT.md`).
- [ ] Revue visuelle mobile + desktop signée.
- [ ] Les 4 rôles couverts par au moins un scénario e2e passant.