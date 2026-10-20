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

### Schéma Commande (`[CONFIRMED]` — aligné sur l'implémentation du backend)

```json
{
  "id": "ord_01H...",
  "reference": "NP-2026-00001245",
  "client": { "id": "usr_...", "fullName": "…" },
  "merchant": { "id": "mer_...", "name": "…" },
  "product": { "id": "prd_...", "name": "…", "price": { "amount": 250000, "currency": "XOF" } },
  "quantity": 2,
  "totalPrice": { "amount": 500000, "currency": "XOF" },
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
- `product.price` est le prix **unitaire** ; `quantity` est la quantité enregistrée.
- `totalPrice` est le **total autoritaire** (`prix unitaire × quantité`), lu en base et
  renvoyé tel quel. Le frontend l'affiche, il ne le recalcule **jamais** (`AGENTS.md` §10).
- Les **totaux, soldes, pénalités, intérêts** sont calculés par le backend et renvoyés ; le frontend ne les calcule jamais.
- `financingMode` ∈ `SAVINGS  VAULT  CREDIT` (Épargne progressive, Coffre NanaPay, Crédit bancaire).
- `financing` est `null` tant qu'aucun financement n'existe, puis renseigné avec
  l'identifiant, le statut et le montant réellement épargné/engagé. C'est le lien
  commande → financement que l'UI affiche (« Montant financé », « Statut du financement »).
  Renseigné pour **chaque mode implémenté** : épargne (`status` = statut de l'épargne,
  `amount` = montant épargné) et coffre (`status` = `FINANCED`, `amount` = montant débité
  du coffre). Une commande financée par le coffre ne doit jamais apparaître comme non financée.

---

## 6. Domaine Financement (Épargne / Coffre / Crédit)

> Trois mécanismes distincts. Ne jamais les fusionner dans un flux générique.

### 6.1 Épargne progressive

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /savings` | ✅ implémenté | `{ items: Savings[], pagination }` — filtre `status` optionnel |
| `GET /savings/:id` | ✅ implémenté | `Savings` |
| `GET /savings/:id/history` | ✅ implémenté | `{ items: SavingsPayment[], pagination }` |
| `POST /savings/start` | ✅ implémenté | `201 Savings` (lié à une commande) — requiert `Idempotency-Key` |
| `POST /savings/:id/payment` | ✅ implémenté | `202 Savings` — versement d'un **montant libre** ; état relu via `GET /savings/:id` |

```json
{
  "id": "sav_01H...",
  "orderId": "ord_...",
  "orderReference": "NP-2026-00001245",
  "targetAmount": { "amount": 250000, "currency": "XOF" },
  "savedAmount": { "amount": 85000, "currency": "XOF" },
  "progressPercent": 34,
  "remainingMonths": 6,
  "monthlyTarget": { "amount": 41666, "currency": "XOF" },
  "maxExtensionMonths": 2,
  "penaltyPercent": null,
  "refundPercent": null,
  "startedAt": "2026-01-01T00:00:00.000Z",
  "deadline": "2026-07-01T00:00:00.000Z",
  "cancelledAt": null,
  "cancellationReason": null,
  "status": "IN_PROGRESS"
}
```

`progressPercent` et `remainingMonths` sont **calculés par le backend** et affichés tels quels : le frontend ne les recalcule jamais. `remainingMonths` vaut `null` si aucune échéance n'est fixée ; `deadline` et `cancelledAt` peuvent être `null`.

`penaltyPercent` / `refundPercent` ne sont renseignés (15 / 85) **que** lorsque l'épargne a échoué (`status = FAILED`) : ils décrivent une conséquence financière réelle et ne doivent pas être affichés à titre préventif.

`POST /savings/:id/payment` — corps : `{ "amount": 5000, "method": "MOBILE_MONEY" | "CARD" }`. Le client choisit **librement** le montant de chaque versement. Règles **validées par le backend** : montant entier, **minimum 1 000 F CFA**, et **plafonné au reste à atteindre** (`targetAmount − savedAmount`). Le front affiche ces règles mais ne les applique pas comme source de vérité. Il n'existe **pas** de versement planifié : l'épargne est alimentée à la demande jusqu'à l'objectif.

Règles métier (affichées, jamais calculées) : extension max **2 mois**, pénalité **15 %**, remboursement **85 %** — valeurs fournies par le backend.

**Garanties backend** : un versement qui atteint l'objectif passe l'épargne en `REACHED` ; un verrou optimiste (`version`) empêche deux versements concurrents de se perdre (le perdant reçoit `409`) ; chaque lecture est scopée au `userId` du jeton.

### 6.2 Coffre NanaPay

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /vault` | ✅ implémenté | `Vault` (solde, plan, progression) |
| `GET /vault/transactions` | ✅ implémenté | `{ items: VaultTransaction[], pagination }` |
| `PUT /vault/plan` | ✅ implémenté | `200 Vault` — définition du plan coffre ; requiert `Idempotency-Key` |
| `POST /vault/use` | ✅ implémenté | `201 Vault` — affectation à une commande ; requiert `Idempotency-Key` |

```json
{
  "id": "vlt_01H...",
  "balance": { "amount": 250000, "currency": "XOF" },
  "eligible": true,
  "targetAmount": { "amount": 500000, "currency": "XOF" },
  "monthlyContribution": { "amount": 20000, "currency": "XOF" },
  "progressPercent": 50,
  "remainingToTarget": { "amount": 250000, "currency": "XOF" },
  "transactionsCount": 4
}
```

`progressPercent` et `remainingToTarget` sont **calculés par le backend** : le frontend les affiche tels quels et ne les recalcule jamais. Tous deux valent `null` tant qu'aucun plan n'est défini (`0 %` décrirait un plan existant mais vide). `remainingToTarget` est borné à `0` si le solde dépasse la somme visée.

`PUT /vault/plan` — corps : `{ "monthlyAmount": 20000, "targetAmount": 500000 }`. **Le client choisit** le montant prélevé chaque mois sur son salaire et la **somme visée**. Le backend **valide** (entiers, unités mineures, > 0, prélèvement ≤ somme visée) et confirme les termes définitifs ; le front n'applique aucune règle métier. Chaque version du plan est conservée dans `VaultPlanHistory`. Le coffre est alimenté **uniquement par prélèvement mensuel sur salaire** : il n'existe **pas** de rechargement manuel.

Contrainte : le Coffre est réservé aux **salariés éligibles** dont le profil bancaire est validé. L'éligibilité (`eligible`) est décidée par le backend, jamais par l'UI ; toute opération sur un coffre non éligible renvoie `403`. Le coffre reste un mécanisme de financement lié à l'éligibilité bancaire, pas un portefeuille générique.

**Garanties backend** : une commande ne peut être financée qu'une fois (`VaultUsage.orderId` unique) ; un verrou optimiste empêche deux financements concurrents de se perdre (le perdant reçoit `409`) ; un solde insuffisant est refusé (`422`) ; chaque lecture est scopée au `userId` du jeton.

`GET /vault/transactions` — chaque mouvement expose un `direction` (`CREDIT` / `DEBIT`) **projeté par le backend** depuis le type métier : le frontend n'interprète jamais `TransactionType`. `CREDIT` = entrée (prélèvement salaire), tout le reste = sortie.

### 6.3 Crédit bancaire

**Espace client — ✅ implémenté.**

| Endpoint | Méthode | Réponse |
|---|---|---|
| `GET /credit/eligibility` | ✅ | `{ eligible, reasons[] }` |
| `GET /credit/profile` | ✅ | `CreditProfile` \| `null` |
| `GET /credit` | ✅ | `Credit` \| `null` (crédit décaissé) |
| `GET /credit/requests` | ✅ | `Paginated<CreditRequest>` |
| `GET /credit/requests/:id` | ✅ | `CreditRequest` |
| `POST /credit/request` | ✅ | `201 CreditRequest` — requiert `Idempotency-Key` |

**Espace Banque — `[PROPOSED]`** (analyse, décision, portefeuille) : `POST /credit/accept` / `reject`, file d'analyse banque. Aucune décision d'octroi n'existe côté client : elle appartient à la banque.

Concepts **distincts** : `CreditProfile` (profil, validé par la banque), `CreditRequest` (demande, créée par le client pour **une** commande), `Credit` (crédit décaissé, porte le remboursement). Ne pas les fusionner.

```json
// GET /credit/eligibility
{ "eligible": false, "reasons": ["Votre profil bancaire est encore en cours de validation."] }

// CreditRequest
{
  "id": "cre_...",
  "orderId": "ord_...",
  "orderReference": "NP-2026-00001245",
  "requestedAmount": { "amount": 45000, "currency": "XOF" },
  "termMonths": 12,
  "ratePercent": 7,
  "totalRepayment": { "amount": 48150, "currency": "XOF" },
  "status": "IN_REVIEW",
  "decisionReason": null,
  "createdAt": "2026-10-20T...",
  "updatedAt": "2026-10-20T..."
}
```

`POST /credit/request` — corps : `{ "orderId": "ord_...", "termMonths": 12 }`. **Le client ne transmet aucun montant** : le montant demandé est celui de la commande, relu en base. Le **taux** et le **total à rembourser** sont calculés par le backend.

`status` d'une demande : le contrat expose quatre états — `IN_REVIEW`, `APPROVED`, `REFUSED`, `CANCELLED`. La table `CreditRequest` utilise l'énumération complète du cycle de vie (`REQUESTED`, `UNDER_REVIEW`, `APPROVED`, `REFUSED`, `DISBURSED`, `REPAYING`, `COMPLETED`, `DEFAULTED`) ; la **traduction est faite par le backend** (`credit.mapper.ts`), seul endroit où elle existe. Les états postérieurs à un accord restent `APPROVED` : l'état de remboursement est porté par `Credit` (`GET /credit`).

**Règles configurables (`backend/src/credit/credit.config.ts`).** Le contrat ne fixait ni barème ni critères : ils sont regroupés dans un fichier nommé et documenté comme **valeurs par défaut provisoires**, jamais enfouis dans une transaction. Barème de taux actuel : `5 %` (≤ 6 mois), `7 %` (≤ 12), `9 %` (≤ 18), `11 %` (≤ 24). Durées acceptées : **3 à 24 mois**. Éligibilité : le **profil bancaire doit être validé** (`creditProfile.status = VALIDATED` **et** `validatedAt` non nul).

> **Gap documenté — données salariales absentes du schéma.** `CreditProfile` ne contient **ni employeur, ni salaire, ni ancienneté**. L'UI Banque (mock) référence ces champs, mais le backend ne peut pas les fournir : `requiresVerifiedSalary` / `minMonthlySalary` sont donc **désactivés par défaut**. Les activer sans ajouter les colonnes correspondantes rendrait **tout le monde inéligible silencieusement**. À traiter lors de l'implémentation de l'espace Banque.

**Garanties backend** : une commande ne donne lieu qu'à **une** demande (`CreditRequest.orderId` unique) — une demande existante est renvoyée telle quelle ; le montant vient de la commande, jamais du corps de la requête ; `Idempotency-Key` obligatoire ; toute lecture est scopée au `userId` du jeton (une demande d'autrui renvoie `404`, pas `403`) ; `remaining` est calculé depuis les remboursements **réellement enregistrés** en base, jamais d'un échéancier théorique.

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
| Statut commande, QR, retrait, règlement | Backend |
| Éligibilité (épargne/coffre/crédit) | Backend |
| Limites (deadline, extension 2 mois) | Backend |

Aucune valeur de cette colonne n'est lue dans `localStorage`, un état React ou un calcul local.

---

## 13. Diffusion / validation du contrat

- Ce document doit être aligné avec les schémas **OpenAPI 3.1** du backend si disponibles.
- Statut `[PROPOSED]` → `[CONFIRMED]` uniquement après validation backend.
- Toute évolution du contrat est évaluée en revue d'architecture avant implémentation frontend.

---

## 14. Endpoints appelés mais non implémentés

Ces routes sont utilisées par le frontend mais **n'existent pas encore** dans le
backend. Elles renvoient une erreur de forme standard (`404 NOT_FOUND`). Elles ne
sont **pas simulées** : le frontend les traite explicitement comme des
fonctionnalités indisponibles (`AGENTS.md` §21).

| Endpoint | Statut | Comportement frontend |
|---|---|---|
| `POST /auth/verify` | ⛔ non implémenté | `VerifyPage.tsx` affiche un état « bientôt disponible » et propose de se connecter. |
| `GET /notifications` | ⛔ non implémenté | `NotificationsPage.tsx` affiche une liste vide normale (« aucune notification »). Dépendance du module Notifications + canal de diffusion. |
| `GET /notifications/summary` | ⛔ non implémenté | Badge de non-lus de `AppShell.tsx` forcé à `0` (`useRequest({ optional: true })`). |
| `POST /notifications/:id/read` | ⛔ non implémenté | Action indisponible tant que le module n'existe pas. |
| `POST /notifications/read-all` | ⛔ non implémenté | Action indisponible tant que le module n'existe pas. |
| `GET /merchants` | ⛔ non implémenté | `BoutiquesPage.tsx` et `SearchPage.tsx` (`optional: true`) : la section boutiques est masquée ou remplacée par « Les boutiques arrivent bientôt ». La recherche de produits reste fonctionnelle. |
| `GET /merchants/meta` | ⛔ non implémenté | Filtres ville/commune indisponibles tant que le module Boutiques n'existe pas. |
| `GET /merchants/:id` | ⛔ non implémenté | `ProductPage.tsx` (`optional: true`) : le bloc boutique reste neutre, la fiche produit demeure utilisable. `StorePage.tsx` affiche « Boutique bientôt disponible ». |

**Règle** : aucun de ces endpoints ne doit être remplacé par une donnée inventée.
Le jour où le backend les expose, le frontend n'a qu'à retirer l'option
`optional: true` — aucun autre changement n'est nécessaire.