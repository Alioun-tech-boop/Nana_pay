# NanoPay — L'essentiel de l'architecture (digest)

> Version : 0.1
> Rôle de ce document : **lecture minimale obligatoire** avant de toucher au code, quelque soit la tâche.
> `ARCHITECTURE.md` reste la **référence complète** (layers, responsabilités) ; ce digest fixe les **règles non négociables**.

---

## 1. La vérité est au backend

| Décidé par le backend | Affiché/traité par le frontend |
|---|---|
| Montants, soldes, prix, pénalités, intérêts, remboursements | Formatage, présentation |
| Statuts (commande, paiement, retrait, crédit, QR) | Rendu visuel des statuts |
| Permissions et rôles (CLIENT / MERCHANT / BANK / ADMIN) | Menus et actions affichées |
| Validité/expiration des QR | Rendu QR, expiration, refresh |
| Règles d'éligibilité (épargne, coffre, crédit) | Tests d'éligibilité UI | 

Règle d'or : **ne jamais considérer l'état frontend comme une autorité financière.**

## 2. Le flux unique de commande

Toute fonctionnalité reste reliée à une commande centrale :

> Client → Produit → Commande → Épargne / Coffre / Crédit → Financement → QR → Commerçant → Retrait → Paiement commerçant → Livraison

Cycle : `CART → ORDER_CREATED → FINANCING_IN_PROGRESS → FINANCED → READY_TO_DELIVER → QR_GENERATED → QR_SCANNED → WITHDRAWAL_CONFIRMED → DELIVERED → MERCHANT_PAID → COMPLETED`.

## 3. Architecture des couches (rappel)

```text
UI / Design System
Pages / Layouts
Features / Domains
Hooks / UI State
Services / Query Layer
API Client
Backend
```

- Les requêtes HTTP passent **uniquement** par la couche API centralisée (pas de `fetch()` dans un composant).
- La logique métier n'est **jamais dupliquée** entre composants.

## 4. Les trois financements sont distincts

- **Épargne progressive** (SAVINGS) — versements, extension max 2 mois, pénalité 15 % / remboursement 85 % (valeurs backend).
- **Coffre NanoPay** (VAULT) — salariés éligibles au profil bancaire validé ; jamais un wallet générique.
- **Crédit bancaire** (CREDIT) — concepts distincts `CreditProfile`, `CreditRequest`, `Credit` ; le produit précède le financement.

Ne pas fusionner les trois dans un composant « financement générique ».

## 5. Sécurité en une ligne

> Le frontend masque l'UI ; le backend autorise. Aucune décision de fonds, permission ou statut ne dépend de Données du client.

Références : `SECURITY.md` (politique complète), `docs/FRONTEND_AUDIT.md` (audit).

## 6. Règles de conduite

1. Aucune vérité financière en `localStorage`/mémoire de session.
2. Toute mutation d'argent : `ConfirmDialog` + `Idempotency-Key` + action `disabled` + confirmation backend.
3. Aucun succès affiché avant confirmation backend.
4. Aucun QR considéré valide sur décision locale.
5. Refresh/retour navigateur → re-fetch backend, jamais reconstruction mémoire.
6. Design system propriétaire obligatoire (tokens `--np-*`), pas de styles ad hoc.
7. Documentation : si le code change l'architecture ou le contrat API, mettre à jour les docs correspondantes.