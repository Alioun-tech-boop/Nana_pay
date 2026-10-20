# NanaPay — Contrat API Frontend

> Version : 0.1 (PROPOSED — à valider par le backend)
> Statut : **Contrat cible, non implémenté. Aucun endpoint n'existe encore.**
> Règle : ce document **décrit ce que le frontend attend du backend REST**. Tant que le backend n'est pas contractualisé, aucun appel réel n'est codé par le frontend.
>
> **Convention de marquage :**
> - `[PROPOSED]` — contrat proposé, en attente de validation par le backend.
> - `[CONFIRMED]` — contrat confirmé par un backend réel (à mettre à jour après couplage).
>
> Le frontend n'implémente jamais un endpoint non confirmé (AGENTS §21).

---

## 1. Principes généraux

| Règle | Définition |
|---|---|
| Source de vérité | **Backend uniquement** (montants, statuts, permissions, QR, retraits, règlements, crédits, épargne, coffre) |
| Format de l'argent | **Entier en minor units** (ex. XOF sans centimes → entier) : `{ "amount": 125000, "currency": "XOF" }` |
| Identifiants | Chaque commande possède **un identifiant unique** : `NP-2026-00001245` (format `NP-YYYY-NNNNNNNN`) |
| Idempotence | Toute mutation d'argent porte l'en-tête `Idempotency-Key` |
| Statuts | Enum **fournies par le backend** et synchronisées avec le frontend (jamais d'enum frontend parallèle) |
| Erreurs | Structure unifiée `{ code, title, detail, field? }` |
| Transport | JSON HTTPS, JWT Bearer, `Content-Type: application/json` |

---

## 2. Conventions de requête/réponse

### 2.1 Headers

| Header | Usage |
|---|---|
| `Authorization: Bearer <access-token>` | Toutes les routes protégées |
| `Idempotency-Key: <uuid>` | **Obligatoire** sur les mutations financières |
| `Accept-Language` | Localisation des messages (`fr`) |
| `X-Request-Id` | Corrélation (généré côté client, renvoyé dans les logs) |

### 2.2 Codes HTTP attendus

| Code | Usage |
|---|---|
| `200` | Lecture / mutation réussie avec corps |
| `201` | Ressource créée (commande, retrait, épargne, crédit) |
| `202` | Mutation acceptée — traitement asynchrone (ex. validation Mobile Money, vérification QR) |
| `400` | Validation requête |
| `401` | Non authentifié |
| `403` | Non autorisé pour ce rôle/ressource (décision de vérité backend uniquement) |
| `404` | Ressource absente ou **volontairement non révélée** |
| `409` | Conflit d'état (ex. paiement déjà confirmé pour ce QR) |
| `412` | État prérequis non satisfait (ex. QR expiré) |
| `422` | Règle métier refusée (ex. financement non éligible, épargne trop courte) |
| `429` | Trop de requêtes |
| `5xx` | Erreur serveur (à ne jamais afficher brute) |

### 2.3 Structure d'erreur unifiée (`[PROPOSED]`)

```json
{
  "code": "QR_EXPIRED",
  "title": "QR expiré",
  "detail": "Ce QR n'est plus valide. Veuillez en générer un nouveau.",
  "field": null
}
```

Contrainte frontend : seuls `code`, `title`, `detail`, `field` sont utilisés. Jamais d'affichage du statut HTTP brut ni d'un message technique (`500 Internal Server Error`, `AxiosError`, `TypeError`).

### 2.4 Pagination (`[PROPOSED]`)

```json
{
  "items": [],
  "pagination": { "page": 1, "pageSize": 25, "total": 132, "hasMore": true }
}
```

Paramètres : `?page=1&pageSize=25`. Tri/ﬁltres par domaine (`sortBy`, `status`).

---

## 3. Authentification

| Endpoint | Méthode | Corps / Paramètres | Réponse | Notes |
|---|---|---|---|---|
| `POST /auth/login` | `[PROPOSED]` | `{ identifier, password }` | `{ accessToken, refreshToken, user }` | `user` ne contient aucune donnée financière |
| `POST /auth/refresh` | `[PROPOSED]` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Rotation : nouveau refresh à chaque rafraîchissement |
| `POST /auth/logout` | `[PROPOSED]` | `{ refreshToken }` | `204` | Invalidation côté backend |
| `GET /auth/me` | `[PROPOSED]` | — | `{ user }` | Rôle, permissions, profil minimal |

**Statut d'implémentation (backend `nanapay-api`, 2026-10-20)**

| Endpoint | État | Note |
|---|---|---|
| `POST /auth/register` | ✅ implémenté | Corps réel du frontend : `{firstName,lastName,birthDate,contact,contactType,email,phone,password}` ; les champs vides sont ignorés. Réponse `{id,fullName,email,phone,status}`. |
| `POST /auth/login` | ✅ implémenté | `identifier` = email **ou** téléphone (l'ancien champ `email` reste toléré). |
| `POST /auth/refresh` | ✅ implémenté | Rotation : l'ancienne session est révoquée. |
| `POST /auth/logout` | ✅ implémenté | `204`. |
| `GET /auth/me` | ✅ implémenté | `{ user }`. |
| `POST /auth/verify` | ⛔ **non implémenté** | Utilisé par `VerifyPage.tsx` après inscription. Nécessite une **table d'OTP** + un canal de diffusion (SMS/email), absents du schéma. Non simulé volontairement → renvoie `404 NOT_FOUND`. |

`password` : minimum **8 caractères** (UI d'inscription livrée + NIST SP 800-63B).

### 3.1 Contrat utilisateur (`[PROPOSED]`)

```json
{
  "id": "usr_01H...",
  "role": "CLIENT",
  "fullName": "…",
  "email": "…",
  "phone": "…",
  "merchantId": null,
  "permissions": ["orders:read", "orders:create", "savings:start"]
}
```

Règles :
- `role` ∈ `CLIENT  MERCHANT  BANK  ADMIN` ([CONFIRMED] — rôle défini par l'architecture produit).
- `permissions` : **menu et actions exacts retournés par le backend**. L'UI masque ce qui n'est pas permis ; le backend reste l'autorité.
- Implémentation : table `role → permissions` dans `backend/src/auth/auth.mapper.ts` (`ROLE_PERMISSIONS`), évaluée côté serveur — le front ne la fournit jamais.
- `merchantId` : renseigné uniquement si l'utilisateur possède une boutique (`User.merchant`).
- Le frontend **ne stocke jamais** les jetons dans `localStorage`/`sessionStorage` (contrainte `SECURITY.md`).

---

## 4. Domaine Produit

| Endpoint | Méthode | Paramètres | Réponse |
|---|---|---|---|
| `GET /products` | `[PROPOSED]` | `page`, `pageSize`, `q`, `categoryId` | `{ items: Product[], pagination }` |
| `GET /products/:id` | `[PROPOSED]` | — | `Product` |

### Schéma Produit (`[PROPOSED]`)

```json
{
  "id": "prd_01H...",
  "merchantId": "mer_01H...",
  "name": "Smartphone X",
  "description": "…",
  "price": { "amount": 250000, "currency": "XOF" },
  "images": [{ "url": "…", "width": 800, "height": 800 }],
  "categoryId": "cat_...",
  "stock": { "available": true, "quantity": 5 },
  "financingEligible": true,
  "status": "ACTIVE"
}
```

Règles : le prix affiché provient **toujours** de ce contrat. Aucun calcul de prix côté frontend.

**Statut d'implémentation (backend `nanapay-api`, 2026-10-20)**

| Endpoint | État | Note |
|---|---|---|
| `GET /products` | ✅ implémenté | Filtres `q`, `categoryId`, `merchantId`. **Public** (pas de jeton requis) : le marketplace se parcourt sans compte. |
| `GET /products/:id` | ✅ implémenté | Public. |
| `GET /categories` | ✅ implémenté | Public. |

Différences avec le schéma ci-dessus :
- les identifiants sont des **UUID**, pas de préfixe `prd_`/`mer_` ;
- `price`/`stock` utilisent le format `{ amount, currency }` / `{ available, quantity }` du contrat ;
- seuls les commerçants `VALIDATED` apparaissent — un compte commerçant `PENDING` n'est jamais exposé.

---

## 5. Domaine Commande (noyau central)

> Une commande relie Client, Produit, Commerçant, structure de financement, QR, retrait et règlement.

| Endpoint | Méthode | Paramètres | Réponse |
|---|---|---|---|
| `POST /orders` | `[PROPOSED]` | `{ productId, financingMode, ... }` | `201 Order` |
| `GET /orders` | `[PROPOSED]` | `page`, `pageSize`, `status` | `{ items: Order[], pagination }` |
| `GET /orders/:id` | `[PROPOSED]` | — | `Order` |
| `GET /orders/:id/status` | `[PROPOSED]` | — | `{ status, at }` |

**Statut d'implémentation (backend `nanapay-api`, 2026-10-20)**

Les 4 endpoints sont ✅ **implémentés** et vérifiés en réel. Points de contrat :

- `POST /orders` exige l'en-tête **`Idempotency-Key`** (8–128 car. `[A-Za-z0-9._:-]`, TTL 24 h) → `400 IDEMPOTENCY_KEY_REQUIRED` sinon.
- Rejeu de la **même clé** → la **même commande** (le stock n'est décrémenté qu'une fois). Même clé avec un **corps différent** → `409 CONFLICT`.
- Le corps réel est `{ productId, financingMode, quantity }` : le **total n'est jamais envoyé par le client**, le backend applique son propre prix × quantité.
- Toutes les lectures sont **scopées par utilisateur** : un `orderId` dans l'URL ne prouve rien.
- Référence de commande : `NP-<année>-<8 chiffres>` (ex. `NP-2026-00000001`).

### Cycle de vie de commande (`[CONFIRMED]` — imposé par l'architecture produit)

```text
CART
ORDER_CREATED
FINANCING_IN_PROGRESS
FINANCED
READY_TO_DELIVER
QR_GENERATED
QR_SCANNED
WITHDRAWAL_CONFIRMED
DELIVERED
MERCHANT_PAID
COMPLETED
```

### Schéma Commande (`[PROPOSED]`)

```json
{
  "id": "ord_01H...",
  "reference": "NP-2026-00001245",
  "client": { "id": "usr_...", "fullName": "…" },
  "merchant": { "id": "mer_...", "name": "…" },
  "product": { "id": "prd_...", "name": "…", "price": { "amount": 250000, "currency": "XOF" } },
  "financingMode": "SAVINGS",
  "financing": { "id": "fin_...", "status": "…", "amount": { "amount": 250000, "currency": "XOF" } },
  "status": "FINANCING_IN_PROGRESS",
  "payment": null,
  "createdAt": "2026-09-17T10:00:00Z",
  "updatedAt": "2026-09-17T10:05:00Z"
}
```

Règles :
- `reference` = identifiant unique central affiché dans l'UI (`NP-YYYY-NNNNNNNN`).
- Les **totaux, soldes, pénalités, intérêts** sont calculés par le backend et renvoyés ; le frontend ne les calcule jamais.
- `financingMode` ∈ `SAVINGS  VAULT  CREDIT` (Épargne progressive, Coffre NanaPay, Crédit bancaire).

---

## 6. Domaine Financement (Épargne / Coffre / Crédit)

> Trois mécanismes distincts. Ne jamais les fusionner dans un flux générique.

### 6.1 Épargne progressive

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /savings` | `[PROPOSED]` | `{ items: Savings[], pagination }` |
| `GET /savings/:id` | `[PROPOSED]` | `Savings` |
| `POST /savings/start` | `[PROPOSED]` | `201 Savings` (lié à une commande) — requiert `Idempotency-Key` |
| `POST /savings/:id/payment` | `[PROPOSED]` | `202` — versement d'un **montant libre** ; status asynchrone vérifié via `GET /savings/:id` |

```json
{
  "id": "sav_01H...",
  "orderId": "ord_...",
  "orderReference": "NP-2026-00001245",
  "targetAmount": { "amount": 250000, "currency": "XOF" },
  "savedAmount": { "amount": 85000, "currency": "XOF" },
  "progressPercent": 34,
  "remainingMonths": 6,
  "maxExtensionMonths": 2,
  "deadline": "2027-03-01",
  "status": "IN_PROGRESS"
}
```

`POST /savings/:id/payment` — corps : `{ "amount": 5000, "method": "MOBILE_MONEY" | "CARD" }`. Le client choisit **librement** le montant de chaque versement. Règles **validées par le backend** : montant entier, **minimum 1 000 F CFA**, et **plafonné au reste à atteindre** (`targetAmount − savedAmount`). Le front affiche ces règles mais ne les applique pas comme source de vérité. Il n'existe **pas** de versement planifié : l'épargne est alimentée à la demande jusqu'à l'objectif.

Règles métier (affichées, jamais calculées) : extension max **2 mois**, pénalité **15 %**, remboursement **85 %** — valeurs fournies par le backend.

### 6.2 Coffre NanaPay

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /vault` | `[PROPOSED]` | `Vault` (solde, plan, historique) |
| `GET /vault/transactions` | `[PROPOSED]` | `{ items: VaultTransaction[], pagination }` |
| `PUT /vault/plan` | `[PROPOSED]` | `200 Vault` — définition du plan coffre ; requiert `Idempotency-Key` |
| `POST /vault/use` | `[PROPOSED]` | `201` — affectation à une commande ; requiert `Idempotency-Key` |

```json
{
  "id": "vlt_01H...",
  "balance": { "amount": 250000, "currency": "XOF" },
  "eligible": true,
  "targetAmount": { "amount": 500000, "currency": "XOF" },
  "monthlyContribution": { "amount": 20000, "currency": "XOF" },
  "transactionsCount": 4
}
```

`PUT /vault/plan` — corps : `{ "monthlyAmount": 20000, "targetAmount": 500000 }`. **Le client choisit** le montant prélevé chaque mois sur son salaire et la **somme visée**. Le backend **valide** (entiers, unités mineures, > 0) et confirme les termes définitifs ; le front n'applique aucune règle métier. Le coffre est alimenté **uniquement par prélèvement mensuel sur salaire**, jusqu'à atteindre la somme visée : il n'existe **pas** de rechargement manuel.

Contrainte : le Coffre est réservé aux **salariés éligibles** dont le profil bancaire est validé. L'éligibilité est décidée par le backend, jamais par l'UI. Le coffre reste un mécanisme de financement lié à l'éligibilité bancaire, pas un portefeuille générique.

### 6.3 Crédit bancaire

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /credit/eligibility` | `[PROPOSED]` | `{ eligible, reasons[] }` |
| `POST /credit/request` | `[PROPOSED]` | `201 CreditRequest` — requiert `Idempotency-Key` |
| `GET /credit/requests/:id` | `[PROPOSED]` | `CreditRequest` |
| `GET /credit` | `[PROPOSED]` | `Credit` (crédit décaissé) |
| `POST /credit/accept` / `reject` | `[PROPOSED]` | Banque — décision |
| `GET /credit/requests` | `[PROPOSED]` | Banque — file d'analyse |

Concepts **distincts** : `CreditProfile` (profil), `CreditRequest` (demande), `Credit` (crédit accordé). Ne pas les fusionner.

---

## 7. Domaine QR

| Endpoint | Méthode | Réponse |
|---|---|---|
| `POST /orders/:id/qr` | `[PROPOSED]` | `201 Qr` |
| `GET /orders/:id/qr` | `[PROPOSED]` | `Qr` |
| `GET /orders/:id/qr/status` | `[PROPOSED]` | `{ state: VALID | EXPIRED | SCANNED | WITHDRAWN | SETTLED, until }` |

```json
{
  "id": "qr_01H...",
  "orderId": "ord_...",
  "payload": "data:image/png;base64,...",
  "expiresAt": "2026-09-17T10:30:00Z",
  "state": "VALID"
}
```

Règles de sécurité :
- Le QR est un **identifiant de transaction** dans le flux de retrait, **pas** une source de décision.
- Validité, expiration et autorisation sont **toujours** décidées par le backend.
- Le frontend affiche, rafraîchit (`POST …/qr`) et interroge le statut ; il ne conclut jamais.

---

## 8. Domaine Commerçant

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /merchant/orders` | `[PROPOSED]` | `{ items: Order[], pagination }` |
| `POST /merchant/scan` | `[PROPOSED]` | `202 { qrId, orderReference, amount }` — validation par backend |
| `GET /merchant/transactions` | `[PROPOSED]` | `{ items: Withdrawal[], pagination }` |
| `GET /merchant/balance` | `[PROPOSED]` | `{ amount, currency }` (pour affichage uniquement) |
| `POST /merchant/settle` | `[PROPOSED]` | `202` — règlement ; requis `Idempotency-Key` |

Séquence non négociable : **QR généré → scanne → vérification backend → retrait confirmé → règlement payé.** Le frontend ne paye jamais automatiquement le commerçant.

---

## 9. Domaine Retrait

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /withdrawals` | `[PROPOSED]` | `{ items: Withdrawal[], pagination }` |
| `GET /withdrawals/:id` | `[PROPOSED]` | `Withdrawal` |
| `POST /withdrawals` | `[PROPOSED]` | `201 Withdrawal` — requiert `Idempotency-Key` |

```json
{
  "id": "wdr_01H...",
  "orderId": "ord_...",
  "orderReference": "NP-2026-00001245",
  "amount": { "amount": 212500, "currency": "XOF" },
  "method": "MOBILE_MONEY",
  "status": "PENDING",
  "confirmedAt": null,
  "createdAt": "2026-09-17T10:20:00Z"
}
```

---

## 10. Domaine Banque & Admin

> Tous les endpoints ci-dessous sont `[PROPOSED]` et implémentés en mode mock pour le développement frontend.

### 10.1 Commerçant

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /merchant/summary` | `[PROPOSED]` | `MerchantSummary` — indicateurs d'activité |
| `GET /merchant/store` | `[PROPOSED]` | `MerchantStore` — informations de la boutique |
| `PATCH /merchant/store` | `[PROPOSED]` | `MerchantStore` — mise à jour de la boutique |
| `GET /merchant/products` | `[PROPOSED]` | `{ items: MerchantProduct[], pagination }` |
| `POST /merchant/products` | `[PROPOSED]` | `201 MerchantProduct` |
| `PATCH /merchant/products/:id` | `[PROPOSED]` | `MerchantProduct` |
| `GET /merchant/orders` | `[PROPOSED]` | `{ items: Order[], pagination }` — commandes marchandes |
| `GET /merchant/orders/:id` | `[PROPOSED]` | `Order` — détail + statuts QR/retrait/règlement |
| `POST /merchant/scan` | `[PROPOSED]` | `202 { qrId, orderReference, amount }` — vérification par backend |
| `POST /merchant/settle` | `[PROPOSED]` | `202` — règlement ; requis `Idempotency-Key` |
| `GET /merchant/payments` | `[PROPOSED]` | `{ items, pagination }` |
| `GET /merchant/transactions` | `[PROPOSED]` | `{ items, pagination }` — historique |
| `GET /merchant/balance` | `[PROPOSED]` | `{ amount, currency }` (affichage uniquement) |

Séquence non négociable : **QR généré → scanne → vérification backend → retrait confirmé → règlement payé.** Le frontend ne paye jamais automatiquement le commerçant.

### 10.2 Banque

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /bank/summary` | `[PROPOSED]` | `BankSummary` — file, portefeuille, RWA |
| `GET /bank/credit-requests` | `[PROPOSED]` | File de demandes (`BankCreditRequest`) |
| `GET /bank/credit-requests/:id` | `[PROPOSED]` | Dossier complet (profil + docs + historique) |
| `POST /bank/credit-requests/:id/decision` | `[PROPOSED]` | `{ decision: APPROVED \| REFUSED, reason }` — requis `Idempotency-Key` |
| `GET /bank/profiles` | `[PROPOSED]` | `{ items: BankClientProfile[], pagination }` |
| `GET /bank/profiles/:id` | `[PROPOSED]` | `BankClientProfileDetail` — profil, docs, demandes |
| `GET /bank/credits` | `[PROPOSED]` | `{ items: BankCredit[], pagination }` — crédits acceptés |
| `GET /bank/transfers` | `[PROPOSED]` | `{ items, pagination }` — virements |
| `GET /bank/orders` | `[PROPOSED]` | Commandes financées/en cours |
| `GET /bank/settlements` | `[PROPOSED]` | Règlements, statuts |

Contrainte : l'analyse de crédit est la **responsabilité exclusive de la banque**. L'interface Admin n'octroie aucune décision de crédit.

### 10.3 Admin

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /admin/summary` | `[PROPOSED]` | `AdminSummary` — indicateurs plateforme |
| `GET /admin/users` | `[PROPOSED]` | `{ items: AdminUser[], pagination }` |
| `GET /admin/merchants` | `[PROPOSED]` | `{ items: AdminMerchant[], pagination }` |
| `GET /admin/orders` | `[PROPOSED]` | `{ items: AdminOrderSummary[], pagination }` |
| `GET /admin/payments` | `[PROPOSED]` | `{ items: AdminPaymentSummary[], pagination }` |
| `GET /admin/credits` | `[PROPOSED]` | `{ items: AdminCreditSummary[], pagination }` |
| `GET /admin/savings` | `[PROPOSED]` | `{ items: AdminSavingsSummary[], pagination }` |
| `GET /admin/vaults` | `[PROPOSED]` | `{ items: AdminVaultSummary[], pagination }` |
| `GET /admin/kyc` | `[PROPOSED]` | `{ items: AdminKycRecord[], pagination }` |
| `GET /admin/qr` | `[PROPOSED]` | `{ items: AdminQrRecord[], pagination }` |
| `GET /admin/withdrawals` | `[PROPOSED]` | `{ items: AdminWithdrawalRecord[], pagination }` |
| `GET /admin/settlements` | `[PROPOSED]` | `{ items: AdminSettlementRecord[], pagination }` |
| `GET /admin/transactions` | `[PROPOSED]` | `{ items: AdminTransactionRecord[], pagination }` |
| `GET /admin/audit` | `[PROPOSED]` | `{ items: AuditEntry[], pagination }` — journal d'audit |

Règles : l'Admin **supervise** (utilisateurs, boutiques, commandes, paiements, crédits, KYC, QR, retraits, règlements, transactions, audit) mais ne décide **jamais** de la validité d'un QR, d'un retrait, d'un règlement ou d'un crédit à la place du backend/de la banque.

---

## 11. Idempotence — règle transversale

Mutouvements concernés :
- `POST /savings/start`, `POST /savings/:id/payment`
- `PUT /vault/plan`, `POST /vault/use`, `POST /credit/request`
- `POST /withdrawals`, `POST /merchant/settle`

Le frontend génère un UUID par opération (`crypto.randomUUID()`), le transmet via `Idempotency-Key`, et **ne répond pas au succès tant que le backend n'a pas confirmé**. Une réponse `201/202` au même `Idempotency-Key` ne crée jamais de seconde opération.

Double-clic, refresh, retry réseau : l'UI désactive l'action (`disabled` + loading) au minimum et compte sur l'idempotence pour les cas limites.

---

## 12. Règles d'affichage (contraintes de contrat)

| Valeur | Source obligatoire |
|---|---|
| Prix produit, total, pénalités, intérêts, remboursement | Backend |
| Progression épargne, solde coffre, montant crédit | Backend |
| Statsssfs commande, QR, retrait, règlement | Backend |
| Éligibilité (épargne/coffre/crédit) | Backend |
| Linites (deadline, extension 2 mois) | Backend |

Aucune valeur de cette colonne n'est lue dans `localStorage`, un état React ou un calcul local.

---

## 13. Diffusion / validation du contrat

- Ce document doit être aligné avec les schémas **OpenAPI 3.1** du backend si disponibles.
- Statut `[PROPOSED]` → `[CONFIRMED]` uniquement après validation backend.
- Toute évolution du contrat est évaluée en revue d'architecture avant implémentation frontend.