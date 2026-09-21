# NanoPay — Contrat d'API Frontend

Document de référence de la couche API frontend.

> **Source de vérité : `API-CONTRACT.md`** (contrat backend `[PROPOSED]`).
> Ce document décrit comment le frontend consomme cette API, pas l'API elle-même.
> Aucun endpoint réel n'est encore confirmé par le backend. Le frontend fonctionne
> aujourd'hui en **mode mock** et basculera sur le backend réel sans changement de code.

---

## 1. Principe

```
Composant
   ↓
Hook / Store
   ↓
Service  (src/services/*)
   ↓
API Client central  (src/api/client.ts)
   ↓
Transport  (realTransport | mockTransport)
   ↓
Backend / Mocks
```

- **Aucun `fetch()` dans les composants ni dans les pages.**
- Toutes les requêtes passent par `api.request<T>()` (`src/api/client.ts`).
- Toutes les URL résident dans les services, jamais dans les composants.
- Aucun `localhost` ni secret dans le code. Tout est configuré par variables
  d'environnement (`src/lib/config.ts`).

---

## 2. Configuration

Variables d'environnement (`.env` → copier `.env.example`) :

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `VITE_NP_API_MODE` | `mock` ou `real` | `mock` |
| `VITE_NP_API_URL` | URL de base de l'API réelle | — |
| `VITE_NP_MOCK_DELAY_MS` | Latence simulée des mocks | `250` |
| `VITE_NP_API_TIMEOUT_MS` | Timeout de chaque requête | `15000` |
| `VITE_NP_LOCALE` | Langue (`fr`) | `fr` |

- Mode `real` sans `VITE_NP_API_URL` → `api` lève une `AppError` explicite
  à la première requête. Refuser de requêter une URL vide **est une protection**.
- Aucun secret ne doit apparaître dans une variable `VITE_*` : le bundle frontend
  est public.

---

## 3. Transport

Interface (`src/api/transport.ts`) :

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface TransportRequest {
  method: HttpMethod
  path: string
  query?: QueryValue                       // objet → querystring
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
  requestId: string
}

interface TransportResult {
  status: number
  data: unknown
}
```

`realTransport` (`fetch`) :

- base URL = `VITE_NP_API_URL`, prefix `/api`;
- timeout via `AbortController` → `AppError` kind `timeout`;
- erreur réseau / `TypeError` → `AppError` kind `network`;
- corps 4xx/5xx parsé en `ApiErrorPayload`.

`mockTransport` :

- aire de test locale (`src/api/mocks/*`), latence simulée (`VITE_NP_MOCK_DELAY_MS`);
- rejette toute route non implémentée en 404 — **le frontend ne fait jamais semblant
  qu'un endpoint backend existe**;
- erreurs simulées au format `ApiErrorPayload` (même forme que le backend).

Sélection du transport : purement configurée via `getConfig().apiMode === 'real'`

---

## 4. Requêtes — en-têtes et identifiants

Chaque requête reçoit :

| En-tête | Source |
| --- | --- |
| `Accept` | `application/json` |
| `Content-Type` | `application/json` (si body) |
| `Accept-Language` | `VITE_NP_LOCALE` |
| `X-Request-Id` | `np_<uuid>` généré par requête |
| `X-Idempotency-Key` | pour les mutations financières (voir §7) |
| `Authorization` | Bearer du jeton fourni par `setTokenProvider` |

- `X-Request-Id` est propagé dans l'erreur (`AppError.requestId`) et affiché à
  l'utilisateur (« Référence : … ») : il permet le diagnostic côté backend.
- **Le jeton n'est jamais stocké dans `localStorage`/`sessionStorage`.**
  Il vit en mémoire (voir `src/stores/session`). Le rafraîchissement passe par un
  canal sécurisé (cookie `httpOnly` côté backend), jamais par le JS du client.

---

## 5. Erreurs — taxonomie

Toutes les erreurs API sont normalisées en `AppError` (`src/lib/errors.ts`).

```ts
type ErrorKind =
  | 'network'        // panne réseau, DNS, TLS
  | 'timeout'        // dépassement du délai d'attente
  | 'unauthorized'   // 401 — identifiants invalides, session expirée
  | 'forbidden'      // 403 — le rôle n'a pas le droit
  | 'not-found'      // 404
  | 'validation'     // 400/422 — champs invalides (getFieldError → message par champ)
  | 'business'       // 422 — règle métier, ex. QR expiré
  | 'conflict'       // 409
  | 'precondition'   // 412
  | 'rate-limit'     // 429
  | 'server'         // 5xx — serveur / partenaire indisponible
  | 'aborted'        // requête annulée (AbortController)
  | 'unknown'
```

Correspondance HTTP (`mapStatusKind`) : `400`→validation, `401`→unauthorized,
`403`→forbidden, `404`→not-found, `409`→conflict, `412`→precondition,
`422`→business, `429`→rate-limit, `5xx`→server.

`AppError` porte : `kind`, `status`, `code` (code métier backend, ex. `QR_EXPIRED`),
`title`, `detail`, `field`, `requestId`.

**Affichage** (`toUserMessage`) : messages français compréhensibles. Jamais
`500 Internal Server Error`, `AxiosError`, `TypeError`, `undefined`, `Network Error`.

```ts
// exemple
Impossible de confirmer le paiement pour le moment.
Veuillez vérifier votre connexion puis réessayer.
```

### Comportement 401

`api` appelle le handler enregistré via `setUnauthorizedHandler` (le store session
se purge). Toute réponse 401 du backend est une décision **backend**, jamais une
inférence frontend sur la validité du jeton.

---

## 6. Payload d'erreur backend attendu

Format `ApiErrorPayload` reçu du backend (mode `real`) :

```json
{
  "error": {
    "code": "QR_EXPIRED",
    "title": "QR expiré",
    "detail": "Ce code n'est plus valide. Régénérez-le.",
    "field": "qrToken",
    "requestId": "req_ab12cd34"
  }
}
```

Si le backend renvoie une autre forme, l'adapter dans `toApiErrorBody`
(`src/lib/errors.ts`), jamais dans les composants.

---

## 7. Idempotence

Opérations financières : `payment`, `financing`, `withdrawal`, `merchant settlement`.

Chaque appel d'une mutation financière envoie :

- `X-Idempotency-Key` = `ipk_<uuid>` généré par `createIdempotencyKey()`;
- le hook `useIdempotencyKey` (mémorise la clé par opération, la change à sa
  fin) + le garde-fou `useMutation` contre les double-clics;
- le store session ne retente **jamais** automatiquement une mutation financière.

Réponse idempotente : le backend doit répondre la même chose pour une clé déjà vue
(le frontend l'utilise pour reconstruire l'état sans double exécution).

---

## 8. Registre de statuts

Le seul mapping frontend des statuts est `STATUS_REGISTRY` (`src/lib/status.ts`),
clé = enum backend, valeur = `{ label, tone }`. S'y conformer strictement.

| Domaine | Clés | Libellé affiché |
| --- | --- | --- |
| Épargne | `IN_PROGRESS` / `PENDING` | EN COURS |
| | `EXTENDED` | PROLONGATION |
| | `REACHED` | ATTEINTE |
| | `FAILED` | ÉCHOUÉE |
| | `REFUNDED` | REMBOURSÉE |
| Crédit | `IN_REVIEW` | EN ANALYSE |
| | `APPROVED` | ACCEPTÉE |
| | `REFUSED` | REFUSÉE |
| Commande | `FINANCED` | FINANCÉE |
| | `READY_TO_DELIVER` | PRÊTE À LIVRER |
| | `DELIVERED` | LIVRÉE |
| | `COMPLETED` | TERMINÉE |

**Règle d'or** : tout statut qui n'est pas dans le registre est affiché tel quel
(passthrough), ton neutre. Le frontend n'invente jamais de statut, de libellé ou de
ton non mandaté par le backend.

Affichage recommandé : `<StatusBadge status={enumBackend} />`
(`src/components/display/StatusBadge.tsx`) qui résout libellé + ton via le registre.

---

## 9. Hooks canoniques

- `useRequest<T>(fn, deps)` — machine à états `idle → loading → success | error`,
  annulation (`AbortSignal`), garde de course (réponses obsolètes ignorées),
  erreur normalisée `AppError`.
- `useMutation<T>` — action avec état `idle | running | success | error`, protection
  anti double-exécution (un second déclenchement pendant l'exécution est ignoré).
- `useIdempotencyKey` / `useFreshIdempotencyKey` — clé d'idempotence par opération.
- `useQrStatus(orderId)` — suivi du statut QR, polling borné (`intervalMs`,
  `maxPolls`), arrêt automatique aux états terminaux (`WITHDRAWN`, `SETTLED`,
  `EXPIRED`), coupure propre au démontage.

---

## 10. Modes mock vs real

| Sujet | Mock | Real |
| --- | --- | --- |
| Sélection | `VITE_NP_API_MODE=mock` (défaut) | `VITE_NP_API_MODE=real` + `VITE_NP_API_URL` |
| Transport | `mockTransport` | `realTransport` |
| Données | `src/api/mocks/*` | backend |
| Secrets | aucun | aucun |

Le code passe d'un mode à l'autre **sans modification de code métier** : seule la
configuration change. Ne jamais laisser de logique métier dépendre de
« est-on en mock ».

Identifiants mock connus (démo) :

- Login : `ada.doumbia@example.com` ou `+225 07 07 00 00 00`, mot de passe `correct`.
- Commandes : `ord_01HACTIVE` (financement en cours), `ord_01HQRGEN` (QR généré),
  `ord_01HCOMPL` (terminée), `ord_01HNEW` (créée).
- Épargne : `orderId === 'ord_01HACTIVE'` pour démarrer.
- QR marchand : le payload doit contenir la chaîne `NEW` dans le corps scanné
  (`COMPLETED` et Cie simulés par états successifs).

---

## 11. Tests et vérification

- `npm run typecheck` — TypeScript strict.
- `npm run build` — build de production.
- Smoke SSR : `npx vite build --ssr src/smoke.tsx && node dist-ssr/smoke.js`
  (échafaudage jetable) — vérifie montage providers + parcours services en mock
  sans navigateur.

Couvrir toujours : happy path, états charge/erreur/vide, réseau coupé, 401/403,
saisie invalide, double-clic, refresh, navigation retour, mobile/desktop.

---

## 12. Règles imposées par AGENTS.md (rappel)

- Le frontend affiche les décisions du backend : soldes, montants, statuts,
  autorisations de retrait, validité des QR — **jamais** décidées côté client.
- Les montants financiers utilisent des unités mineures entières (`int`,
  `minor units`), pas d'arithmétique flottante.
- `RequireRole` est un masque d'interface, pas une frontière de sécurité. Le
  backend reste seul juge des permissions.
- Un événement Mobile Money qui « réussit » ne signifie pas paiement confirmé :
  l'UI reflète l'état confirmé par le webhook backend.
- Propagation identifiée, jamais de `console.log` de données sensibles.