# NanoPay — Audit de sécurité Frontend

> Version : 0.1
> Réalisé par : revue de sécurité du frontend (réf. `AGENTS.md` §29, `SECURITY.md`).
> Principe directeur : **le frontend n'est jamais une frontière de sécurité.**
> Le backend reste l'unique autorité pour l'identité, les rôles, les permissions, la propriété des ressources, les montants, les statuts, les transitions, le QR et les paiements.

---

## 1. Périmètre & méthode

- Analyse du code source `src/` (React 19 + Vite + TS strict) : composants, stores, services, couche API, mocks, routes, hooks.
- Recherche ciblée : secrets, clés API, credentials, stockage navigateur, XSS, URLs externes, uploads, redirections, guards, gestion de session, données personnelles/financières, QR, Mobile Money.
- Vérification finale : `typecheck` + `build` verts (aucun test automatisé présent dans le dépôt au moment de l'audit).

---

## 2. Résumé exécutif

| Domaine | État | Détail |
|---|---|---|
| Secrets / clés / credentials | ✅ | Aucun secret en dur. Uniquement des valeurs de démo explicites (`mock`, password `correct`). |
| Stockage navigateur | ✅ | **Aucun** `localStorage` / `sessionStorage` / cookie lisible par JS. Jetons en mémoire uniquement. |
| XSS / injection | ✅ | Aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`. Rendus React échappés. |
| URLs externes / redirections | ✅ | Aucune URL externe construite ; `fetch` avec `redirect: 'error'` ; redirection de login assainie. |
| Uploads / fichiers | ✅ (durci) | `FileUpload` ne lit que métadonnées ; filtre `accept` désormais appliqué aussi au drag & drop. |
| Validation | ⚠️ | Validation UX présente (formulaires) ; la validation de sécurité reste exclusivement backend. |
| Routes protégées | ✅ UX | `RequireAuth` + `RequireRole` masquent l'interface ; l'autorisation est réaffirmée par le backend. |
| Session (expiration / refresh / 401 / 403) | ✅ (reconstruit) | Boot restore (mode réal), refresh single-flight avec retry, 401 → refresh → sinon expirer, 403 isolé. |
| Logout | ✅ | Révocation du refresh token côté backend puis purge locale, dans `finally`. |
| Erreurs | ✅ | Messages utilisateur traduits ; jamais d'erreur technique brute ; `requestId` de corrélation. |
| Données personnelles | ✅ | Affichées depuis le backend, chargées à la demande, gardées en mémoire. |
| CNIB / documents bancaires | ✅ | Aucun contenu de document stocké côté client (labels/statuts seulement). |
| QR | ✅ | Le frontend soumet les données scannées et affiche la **décision backend** — il ne valide jamais. |
| Mobile Money | ✅ | Le statut payé est reflété depuis le backend uniquement ; idempotence via `Idempotency-Key`. |
| Logging / console | ✅ | Aucun `console.log` applicatif ; logger de requêtes non câblé. |

---

## 3. Menaces & mesures

### 3.1 Secrets, clés API, credentials

**Menace :** clé API, secret, credential commité dans le bundle (le code frontend est public).

**Mesures :**
- Aucune correspondance `password|secret|api[_-]?key|token|Bearer` en dur hors valeurs de démo mock et noms de champs.
- Proxy/transport : seul `Authorization: Bearer <token>` est ajouté dynamiquement (`src/api/client.ts`).
- Variables d'environnement limitées aux valeurs publiques (`VITE_NP_*`) dans `src/lib/config.ts` ; `.env.example` documenté « valeurs publiques uniquement ».

### 3.2 Stockage navigateur

**Menace :** vol de session via XSS persistant ou dispositif partagé si le jeton est persistant (`localStorage`/`sessionStorage`/cookie lisible).

**Mesures :**
- **Zéro stockage persistant.** Recherche `localStorage`/`sessionStorage`/`document.cookie` : aucun résultat.
- `accessToken` et `refreshToken` vivent dans des refs mémoire (`tokenRef`, `refreshTokenRef` dans `SessionContext.tsx`) et sont perdus au rechargement — aucun jeton ne survit à la fermeture.
- En mode réel, la restauration de session passe par `GET /auth/me` contre la session **cookie httpOnly** gérée par le backend (cf. `SECURITY.md` §2.2).

### 3.3 XSS / injection

**Menace :** injection HTML/JS via contenu backend ou saisie utilisateur.

**Mesures :**
- Aucun `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`.
- Tout le texte est rendu via React (échappement automatique). Aucune reconstruction de HTML à partir de données brutes.
- Le contenu (noms de produits, messages, notifications) est affiché tel que fourni par le backend (assainissement backend).

### 3.4 URLs externes & redirections

**Menace :** open redirect après login, exfiltration via URL construite par l'attaquant, navigation `fetch` vers origine indésirable.

**Mesures :**
- Aucune URL externe (http/https) construite dans le code ; aucune utilisation de `window.open`/`location.href`.
- `realTransport` : `fetch(url, { redirect: 'error' })` → les redirections HTTP ne sont jamais suivies.
- `LoginPage` : la destination `from` (état de navigation) est validée par `safeRedirectPath` (`src/lib/redirect.ts`) : rejet si ne commence pas par `/`, commence par `//`, contient espaces/backslashes ou un schéma dans le premier segment.

### 3.5 Uploads & fichiers

**Menace :** envoi de fichiers non conformes (polymorphes, surdimensionnés) vers un backend vulnérable.

**Mesures (UI) :**
- `FileUpload` lit uniquement `name/size/type` (aucune lecture du contenu, aucun object URL, aucune persistance).
- Vérification `maxSize` + filtre `accept` appliqué sur le sélecteur **et** le drag & drop (`src/design-system/primitives/FileUpload/FileUpload.tsx`).
- **Rappel :** la sécurité réelle des fichiers (analyse, taille, type MIME, stockage) est une décision backend.

### 3.6 Validation des entrées

- Validation UX côté frontend (formulaires d'auth, marchand, banque) pour l'expérience.
- **La validation backend reste la barrière de sécurité** : le frontend n'expose jamais une protection « uniquement client » comme si elle était suffisante.

### 3.7 Routes protégées & autorisation

**Menace :** accès aux espaces `/merchant`, `/bank`, `/admin` par manipulation du navigateur.

**Mesures :**
- `RequireAuth` (authentification) + `RequireRole` (rôles/permissions) masquent l'interface (UX).
- Ces guards **ne sont pas une frontière de sécurité** : le backend doit rejeter tout accès non autorisé (403). Les pages affichent l'erreur traduite « accès refusé ».
- Aucune décision d'autorisation basée sur URL/query/état frontend/bouton caché.

### 3.8 Session : expiration, refresh, 401, 403

**Mécanisme implémenté** (`src/stores/session/SessionContext.tsx` + `src/api/client.ts`) :

```text
BOOT (mode réel) → GET /auth/me (cookie httpOnly)
        ├─ succès  → session restaurée (authenticated)
        └─ échec   → unauthenticated → /login

REQUÊTE AUTHENTIFIÉE → Bearer token mémoire
        └─ 401 (tentative 0)
             → refresh single-flight (POST /auth/refresh)
                 ├─ succès → rotate tokens → RETRY de la requête (1 seule fois)
                 └─ échec  → purge session + toast « session expirée » + /login

403 → aucune purge de session ; message traduit « accès refusé » (jamais de contournement)

LOGOUT → POST /auth/logout ({ refreshToken }) → purge locale dans finally
```

Points d'attention :
- Le refresh est **single-flight** (une seule requête pour toutes les 401 concurrentes, `refreshInFlightRef`).
- Aucun retry automatique au-delà d'**une** tentative par requête.
- `auth:false` (login/register/verify/refresh) n'entraîne ni refresh ni purge.
- Le boot en mode **mock** ne restaure jamais de session : sans credentials persistés, aucune session ne peut exister après rechargement → redirection vers `/login` (comportement honnête, pas de session fabriquée).

### 3.9 Gestion des erreurs

- `AppError` typé (`kind`, `status`, `code`, `requestId`) ; mapping HTTP (`mapStatusKind`).
- `toUserMessage` produit des messages utilisateur traduits (pas de `500 Internal Server Error`, `AxiosError`, etc.).
- Erreur réseau → « Vérifiez votre connexion puis réessayez » ; `401` → « session expirée » ; `403` → « accès refusé » ; `404` → « introuvable » sans révéler l'existence.
- Erreurs financières jamais masquées ; états `FAILED` explicites.

### 3.10 Données personnelles & financières

- Balances, prix, pénalités, intérêts, statuts : toujours affichés depuis les valeurs backend (minor units).
- Aucune valeur financière autoritaire calculée ni persistée côté client (sous-total panier = affichage éphémère en mémoire uniquement).
- Données chargées à la demande, gardées en mémoire (`useRequest`), jamais dans localStorage.
- `X-Request-Id` pour corrélation ; le logger associé n'est pas câblé (aucune donnée sensible loggée).

### 3.11 CNIB & documents bancaires

- Les documents (CNIB, justificatifs de revenus, attestations d'emploi) sont représentés côté frontend par **métadonnées** (label, type, statut, date) — le contenu/document lui-même n'est ni stocké ni prévisualisé côté client.
- La consultation des documents et leur validation sont des décisions du backend (espaces Banque/Admin).

### 3.12 QR

- Le frontend génère/affiche le QR fourni par le backend, ou soumet les données scannées.
- **Il ne décide jamais** de la validité, de l'expiration ou de l'autorisation : le resultat de scan est la réponse backend (`MerchantScanPage` : « QR valide — retrait autorisé par le **backend** » ou « QR refusé par le backend »).
- Le règlement commerçant n'est possible qu'après des décisions backend correspondantes ; idempotence par `Idempotency-Key`.

### 3.13 Informations Mobile Money

- Aucun numéro/information Mobile Money saisi ou stocké côté client dans les flux actuels.
- Le statut d'un paiement Mobile Money n'est jamais déduit de l'interface du tiers : il provient de la confirmation backend (webhook → backend → frontend).
- Toute mutation financière porte une clé d'idempotence + protection contre le double clic (`useMutation` busy-ref).

### 3.14 Mock hostile

- Les mocks (`src/api/mocks/auth.ts`) ne restaurent `/auth/me` que si `Authorization: Bearer mock-access-token` est présent ; `/auth/refresh` et `/auth/logout` exigent un jeton valide.
- Les autres routes mock n'exigent **pas** d'autorisation : elles servent à démontrer l'UX. En production, le backend doit appliquer la totalité des contrôles (rôles, propriété des ressources, montants, transitions).

---

## 4. Risques résiduels (acceptés)

| Risque | Réponse |
|---|---|
| Les mocks n'appliquent pas l'autorisation des espaces pro | Mocks de démonstration isolés (`src/api/mocks/`) ; en mode réel, le backend est l'unique autorité. |
| `dangerouslySetInnerHTML` interdit mais non bloqué par une règle de compilation | Révisé manuellement + section checklist ; peut être renforcé par ESLint `react/no-danger`. |
| Santé des dépendances | `npm audit` à exécuter en CI (aucun script npm dédié dans ce dépôt). |
| CSRF : aucun cookie lisible par JS utilisé ; cookies httpOnly (backend) + CORS stricte backend à garantir | Confidentialité du cookie et politique CORS portées par le backend. |
| Le contenu de documents sensibles affiché par le backend suppose un backend assaini | À vérifier côté backend (assainissement, droit d'accès par rôle/propriété). |
| Aucun test automatisé (RTL/e2e) dans le dépôt | La checklist §5 inclut les scénarios à couvrir ; création des tests nécessaire. |
| CSP non présente dans le bundle (dépend de l'hôte) | `SECURITY.md` §12.3 : à déclarer côté serveur (`script-src 'self'`, `frame-ancestors 'none'`). |

---

## 5. Checklist (avant livraison)

- [ ] Aucun secret/clé/credential dans le bundle (grep `password|secret|api_key|token`).
- [ ] Aucun `localStorage` / `sessionStorage` / cookie JS pour jetons, balances ou statuts.
- [ ] Aucun `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function`.
- [ ] Pas d'URL externe construite ; `from` assaini avant `navigate`.
- [ ] Uploads : taille + `accept` contrôlés ; aucune lecture de contenu fichier côté client.
- [ ] `RequireAuth` + `RequireRole` en place ; backend rejette réellement les accès non autorisés (e2e de cloisonnement).
- [ ] `401` : refresh single-flight puis retry unique ; échec → purge + `/login` avec message.
- [ ] `403` : pas de purge de session ; message « accès refusé ».
- [ ] `logout` : révocation backend (`auth/logout`) puis purge locale.
- [ ] Boot : jamais de session fabriquée (mock) ; restauration uniquement via `me()` backend.
- [ ] Erreurs utilisateur traduites ; jamais d'erreur technique brute ni de détail sensible.
- [ ] QR : jamais de décision locale de validité ; affichage de la réponse backend uniquement.
- [ ] Paiements : statut reflété depuis le backend ; `Idempotency-Key` sur les mutations financières.
- [ ] Double clic bloqué sur les actions financières.
- [ ] Aucun `console.log`/`debugger` applicatif.
- [ ] `typecheck` + `build` verts.

---

## 6. Scripts de vérification

```bash
npm run typecheck   # tsc --noEmit
npm run build       # vite build
```

Pour une revue manuelle de secrets (Windows PowerShell) :

```powershell
Get-ChildItem -Recurse -File src | Select-String -Pattern 'password|secret|api[_-]?key|Bearer [A-Za-z0-9]' | Select-Object -First 50
```