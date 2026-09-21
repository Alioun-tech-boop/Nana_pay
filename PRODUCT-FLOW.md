# NanoPay — Parcours Produit (Product Flows)

> Version : 0.1 (PROPOSED)
> Objectif : définir les parcours utilisateur par rôle, alignés sur **une commande centrale unique** :
> **Client → Produit → Commande → Épargne / Coffre / Crédit → Financement → QR → Commerçant → Retrait → Paiement commerçant → Livraison.**
> Règle : tous les statuts affichés proviennent du backend. L'UI ne conclut jamais.

---

## 1. Le flux central unique

```text
CART
  → ORDER_CREATED
  → FINANCING_IN_PROGRESS (épargne | coffre | crédit)
  → FINANCED
  → READY_TO_DELIVER
  → QR_GENERATED
  → QR_SCANNED
  → WITHDRAWAL_CONFIRMED
  → DELIVERED
  → MERCHANT_PAID
  → COMPLETED
```

Correspondance visuelle (côté Client / Commerçant / Banque / Admin) : `OrderTimeline` alimenté par le statut backend, jamais auto-déclaré.

---

## 2. Parcours Client

### 2.1 Découverte & création de commande
1. **Catalogue produits** : liste, recherche, catégorie, détails produit.
2. **Détail produit** (avec `financingEligible` et `price` fournis par le backend) :
   - Prix → toujours affiché via `Amount` depuis le backend.
   - Financement proposé **si le produit y est éligible** (backend).
3. **Création de commande** : sélection du mode de financement :
   - `SAVINGS` (Épargne progressive) — **peut être différée/étendue** (max 2 mois, règles backend).
   - `VAULT` (Coffre NanoPay) — réservé aux salariés éligibles (décision backend).
   - `CREDIT` (Crédit bancaire) — le produit passe avant le financement ; jamais de crédit « flottant » déconnecté d'une commande.
4. **Confirmation de création** : `ConfirmDialog` avec référence `NP-YYYY-NNNNNNNN`, produit, montant, méthode. Bouton `disabled` pendant l'appel + `Idempotency-Key`.

### 2.2 Épargne progressive
1. Vue de l'épargne : cible, épargné, progression %, échéance, échéance, prochain versement — **valeurs backend**.
2. Versement (Mobile Money) :
   - `ConfirmPayment` → POST → statut **asynchrone** (202).
   - L'UI **ne considère pas un succès Mobile Money comme un paiement NanoPay confirmé** : elle interroge le backend et n'affiche `Confirmé` que sur confirmation backend.
3. Échec de versement → rejet/refus affiché (jamais d'erreur technique brute).
4. Extension d'épargne : le bouton/date limite vient du backend (max 2 mois) ; l'UI n'invente pas les durées.

### 2.3 Coffre NanoPay
1. Vue coffre : solde, historique, éligibilité (backend).
2. Affectation du coffre à une commande éligible : confirmation + `Idempotency-Key`.
3. Toujours affiché comme **mécanisme de financement validé pour salariés**, pas comme un wallet générique.

### 2.4 Crédit bancaire
1. Vérification d'éligibilité (backend).
2. `CreditRequest` : demande liée à une commande.
3. Attente de décision → **statut backend** (`PENDING → APPROVED | REFUSED`).
4. Si accordé : vue du `Credit` associé à la commande.

### 2.5 Paiement / QR / livraison
1. Quand `FINANCED` : `QrDisplay` (payload backend, `expiresAt`, refresh, statut).
2. Suivi du retrait : attente confirmation backend.
3. Livraison confirmée → confirmation finale → reçu de paiement (`PaymentReceipt`).
4. Refus/échec possible à chaque étape : `<InlineAlert>` + action idoine.

---

## 3. Parcours Commerçant

1. **File d'ordres** : commandes financées prêtes (statut backend).
2. **Scan du QR** : `ScanSurface` (appareil photo ~) → envoi des données au backend → **décision affichée uniquement après réponse backend** :
   - `QR valide, retrait autorisé` / `QR expiré` / `QR déjà scanné` / `Mauvais commerçant`.
3. **Retrait confirmé** (`WITHDRAWAL_CONFIRMED`) → le commerçant voit la transaction (montant net = vendeur).
4. **Règlement** : `MERCHANT_PAID` après retrait confirmé ; **jamais** de paiement automatique sur simple scan — c'est le backend qui valide l'état. `POST /merchant/settle` avec `Idempotency-Key`.
5. **Solde / transactions / caisse** : valeurs backend (affichage uniquement).

Séquence d'interface obligatoire :

```text
QR scanné → Envoi backend → Vérification → Retrait confirmé → Règlement → Reçu
```

---

## 4. Parcours Banque

1. **File de demandes de crédit** : `BankReviewCard` (profil, documents, historique, montant lié à la commande).
2. **Analyse** : consultation du dossier (le frontend n'effectue jamais de scoring — il présente le dossier).
3. **Décision** `APPROVED` / `REFUSED` avec motif → confirmation → statut propagé.
4. **Supervision** : commandes financées, règlements en cours, statuts.
5. La Banque est le seul intervenant de la décision de crédit ; l'Admin ne remplace pas ce rôle.

---

## 5. Parcours Admin

1. **Supervision** : utilisateurs, commerçants (validation), produits, commandes, paiements, crédits, activité.
2. **Validation commerçant** : activation/suspension.
3. **Audit** (`[EXTENSION]`) : journal des actions sensibles.
4. L'Admin **gère le système** mais n'accorde aucune autorisation de crédit à la place de la Banque et ne manipule pas les fonds à la place du Commerçant.

---

## 6. Tranches d'échec (display nécessaire)

| Étape | Échec | Affichage |
|---|---|---|
| Commande | Refus backend (produit non éligible) | `InlineAlert` code + CTA retour catalogue |
| Épargne | Versement refusé | Longueur/valeur + suggestion continue/réessayer ou extension (backend) |
| Crédit | Refus bancaire | Cause générique (`REFUSED`), jamais de détail bancaire interne |
| Paiement | Network / Mobile Money échoué | « Impossible de confirmer le paiement pour le moment » + retry boiteux borné |
| QR | Expiré | Message + bouton « Générer un nouveau QR » |
| Retrait | Non autorisé / montant erroné | Code + état (le montant affiché reste celui du backend) |
| Règlement | Pas encore éligible | Statut `WITHDRAWAL_CONFIRMED` manquant → « pas encore validé par le backend » |

---

## 7. Règles de navigation (routes implémentées)

Plan de routes implémenté dans `src/app/App.tsx` (Protection : `RequireAuth` + `RequireRole` — garde UI, l'autorisation reste au backend) :

```text
/                              Landing
/login  /register  /verify     Auth (tout rôle) — redirection par rôle après connexion

CLIENT  (RequireRole CLIENT)
  /marketplace  /search        Catalogue
  /shops/:merchantId           Boutique
  /products/:productId         Détail produit
  /cart  /checkout             Commande
  /savings  /savings/:savingsId  /vault  /credit   Financement
  /purchases  /orders/:orderId  /orders/:orderId/qr
  /history  /dashboard  /profile  /notifications

MERCHANT (RequireRole MERCHANT)
  /merchant                    Tableau de bord
  /merchant/orders  /merchant/orders/:orderId
  /merchant/scan               Scanner QR
  /merchant/payments
  /merchant/products  /merchant/products/new  /merchant/products/:productId
  /merchant/store  /merchant/history  /merchant/profile

BANK     (RequireRole BANK)
  /bank                        Tableau de bord
  /bank/requests  /bank/requests/:requestId
  /bank/profiles  /bank/profiles/:clientId
  /bank/credits  /bank/transfers  /bank/settlements
  /bank/history  /bank/profile

ADMIN    (RequireRole ADMIN)
  /admin                       Tableau de bord
  /admin/clients  /admin/merchants  /admin/kyc
  /admin/orders  /admin/payments  /admin/transactions
  /admin/savings  /admin/vaults  /admin/credits
  /admin/qr  /admin/withdrawals  /admin/settlements
  /admin/audit  /admin/profile
```

Guards : `RequireRole` masque les routes selon le rôle (UX), le **backend reste l'autorité**. Un utilisateur manipulant le navigateur ne gagne aucune permission.
Refresh : toute page critique recharge l'état depuis le backend (jamais de reconstruction uniquement depuis la mémoire).

---

## 8. État visuel par étape (modèle UI)

| État | Affichage |
|---|---|
| `IDLE` | Écran prêt, aucun appel en cours |
| `LOADING` | `Skeleton` contextuel (« Chargement… ») |
| `SUCCESS` | Contenu + statuts backend |
| `PENDING` | Timing/pending affiché (`PENDING`, `PROCESSING`), jamais « done-ish » |
| `ERROR` | `InlineAlert` + retry si pertinent |
| `CONFIRMED / FAILED / CANCELLED / REFUNDED` | `StatusPill` explicites |

Aucun état vaseux du type « almost » / « done-ish ».