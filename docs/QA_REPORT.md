# QA Report — NanoPay Frontend

Date : 17 septembre 2026
Statut : **123 tests — tous verts** · `typecheck` et `build` OK

## 1. Portée

Campagne de QA automatisée sur le frontend NanoPay couvrant :

- Couche API (client, transport, cache, erreurs, authentification, idempotence)
- Flux métier complets via le **mock backend** : marketplace, commande, épargne progressive, crédit bancaire, Coffre NanoPay, QR, retrait, règlement, espaces MERCHANT / BANK / ADMIN
- Sécurité applicative : accès non authentifié, token invalide, IDs trafiqués, QR invalide, soumission dupliquée, préconditions financières
- Hooks : `useRequest` / `useMutation` (états, protection double-clic)
- Guards : `RequireAuth` / `RequireRole` (URL directe, rôle croisé, redirection)
- États UX : chargement, succès, états vides, messages d'erreur, affichage monétaire

## 2. Environnement de test

| Élément | Valeur |
| --- | --- |
| Runner | Vitest 5.0.1 (pool `threads`) |
| Environnement | jsdom 29.1.1 |
| RTL | @testing-library/react 16.3.3 + jest-dom 7.0.1 + user-event 14.6.7 |
| Mode API | `VITE_NP_API_MODE=mock`, délai mock 0 |
| Setup | `src/test/setup.ts` (matchers jest-dom, cleanup, mock `matchMedia`, `crypto.randomUUID`) |
| Commandes | `npm test` · `npm run test:watch` · `npm run test:coverage` |

> Note Windows : le pool worker `forks` par défaut ne démarre pas sur cette machine
> (timeout au démarrage). `pool: 'threads'` est configuré dans `vite.config.ts`
> et corrige le problème de façon durable.

## 3. Inventaire des tests

| Suite | Fichier | Tests | Couverture |
| --- | --- | --- | --- |
| API client | `src/api/__tests__/apiClient.test.ts` | 18 | mapping erreurs 401→403→404→409→422→429→500, réseau/offline→`network`, timeout, abort non wrappé, retry 401+refresh single-flight, handler `auth failure`, header `Idempotency-Key`, cache (TTL / invalidation / clear / POST non mis en cache / option `noCache`), header Authorization |
| Sécurité mock | `src/api/__tests__/mockSecurity.test.ts` | 23 | 401 sans token / token invalide, 404 IDs trafiqués (produit, commande, épargne, produit marchand, dossier crédit), QR invalide→412, doublon `POST /orders` (absence d'idempotence serveur documentée), route non mockée→404, refus de règlement sans retrait confirmé, scan valide `NP-2026-00001230`, termes crédit 1/36→422, décision banque invalide→422, coffre non éligible→422, retrait mauvais order→422, flux auth (register/verify/login/refresh) |
| Flux métier | `src/api/__tests__/mockFlows.test.ts` | 64 | découverte marketplace, création commande (produit financeable / non financeable), épargne (start / getById / versement / historique / objectif atteint 100%), QR (génération / statut / 404), retrait (PENDING / 422), crédit (éligibilité / demande / 422 / détail / actifs / liste), coffre (solde / utilisation / 422 / transactions), merchant (résumé / boutique / produits / commandes / scan / transactions / paiements / solde / règlement), bank (résumé / dossiers / décision / crédits / transferts / profils), admin (résumé / utilisateurs / commerçants / commandes / paiements / épargnes / crédits / retraits / KYC / audit / règlements / transactions / QR / coffres) |
| Hooks | `src/hooks/__tests__/hooks.test.tsx` | 8 | `useRequest` (idle→loading→success, erreur AppError + onError, stale after unmount, désactivé), `useMutation` (success, mapping erreurs, **blocage des appels concurrents / double-clic**, reset) |
| Guards | `src/components/__tests__/auth/guards.test.tsx` | 4 | redirection `/login` non authentifié, contenu CLIENT, fallback rôle croisé, contenu MERCHANT |
| États UX | `src/features/__tests__/ux-states.test.tsx` | 6 | rendu marketplace (recherche + sections), EmptyState, MoneyAmount (`125 000 F CFA`), traductions d'erreur utilisateur (réseau / serveur / brut masqué) |

**Total : 123 tests · 6 fichiers.**

## 4. Résultats

- `npm test` : **123/123 verts**
- `npm run typecheck` : 0 erreur
- `npm run build` : OK (code splitting inchangé, chunks par route conservés)
- Coverage (v8, seuils non bloquants) :

| Zone | % Stmts | % Branch | % Funcs | % Lines |
| --- | --- | --- | --- | --- |
| **Total** | 68.87 | 57.90 | 65.30 | 72.93 |
| API client (`client.ts`) | 89.02 | 88.52 | 76.47 | 91.42 |
| `mockTransport` | 75.00 | 75.00 | 80.00 | 75.00 |
| Mocks | 72.00 | 56.81 | 76.28 | 77.36 |
| `useRequest` | 96.36 | 94.44 | 75.00 | 98.00 |
| `errors.ts` | 77.77 | 71.57 | 88.88 | 88.00 |

## 5. Bugs trouvés et corrections

### 5.1 `mockTransport` — erreur de route non mockée inconsistante (corrigé à la source)
- **Observation** : une route jamais mockée levait `{ kind: 'not-found', status: null }`.
- **Correction** : `src/api/mockTransport.ts` inclut désormais `status: 404`
  (code `ROUTE_NOT_MOCKED` conservé pour le diagnostic de dev), cohérent avec le
  comportement d'une API réelle (404) et avec `mapStatusKind`.
- **Test de régression** : `mockSecurity › unrouteable endpoints › returns 404 for completely unmocked route`.

### 5.2 Corrections de portée dans les tests (pas un bug applicatif)
- Le test de règlement « settle » utilisait `ord_01HQRGEN`, qui appartient au domaine
  QR client et non aux commandes de la boutique marchande. Remplacé par
  `ord_01HMWCONF` (statut `WITHDRAWAL_CONFIRMED`, retrait confirmé) — le seul état
  qui permet un règlement accepté selon les règles du mock.
- Le test hooks affirmait une propriété `isIdle` inexistante sur `useMutation`
  (propriété propre à `useRequest`) ; il vérifie maintenant `status === 'idle'`.
- Les assertions de traduction d'erreur ont été alignées sur les messages réels
  (`Impossible de joindre le serveur…`, `…Réessayez plus tard.`).

### 5.3 Infrastructure
- Pool worker `forks` non fonctionnel sur Windows (timeout) → `pool: 'threads'`
  activé dans `vite.config.ts` (résolu à la source, pas contourné par script).

## 6. Invariants financiers vérifiés

- **Backend = source de vérité** : les flux passent tous par `api.request` via le
  mock ; aucune valeur financière calculée du côté test.
- **Source de financement** : `PRODUCT → ORDER → FINANCING` ; commande non
  financeable → 422 (pas de financement détaché d'un produit).
- **Règlement marchand** : refus tant que le retrait n'est pas `CONFIRMED`
  (`SETTLEMENT_NOT_ALLOWED`) ; refus si déjà `MERCHANT_PAID`/`COMPLETED`.
- **QR** : payload non reconnu → 412 ; scan valide uniquement sur référence connue.
- **Protection double-clic** : `useMutation` bloque les appels concurrents
  (busy-ref) — testé.
- **Idempotence** : l'en-tête `Idempotency-Key` est envoyé par le client ; le front
  génère des clés anti-doublon. Voir cependant le risque 7.2.

## 7. Risques restants et recommandations

1. **Le mock backend n'applique aucune vérification de rôle.** Un client authentifié
   peut appeler `/merchant/*`, `/bank/*`, `/admin/*` en mode dev ; le login mock
   retourne un jeton unique (`mock-access-token`) pour tous les rôles. C'est une
   commodité de développement : **le backend réel doit imposer l'autorisation**
   (les guards frontend ne sont pas une frontière de sécurité). Recommandation :
   ajouter l'enforcement des rôles dans les tests du backend et un jeu de jetons
   scopés par rôle dans le mock.
2. **`POST /orders` (mock) n'a pas d'idempotence serveur** : un double envoi crée
   deux commandes dans le mock. Le frontend est protégé (clé d'idempotence envoyée,
   double-clic bloqué), mais le test documente explicitement que **le backend doit
   garantir l'idempotence** des opérations financières.
3. **Chemin réseau réel non couvert** : `realTransport.ts` à 2.6 %. Nécessite un
   mock `fetch` une fois le contrat d'API stabilisé (statuts réels, `Retry-After`,
   timezone, etc.).
4. **Couverture services partielle** (~49 %) : les services sont de fins wrappers
   du client API déjà testé ; extension recommandée pour les règles de mapping
   spécifiques (ex. pagination, tris).
5. **Absence de tests d'interaction page complète** : la suite couvre les états et
   les guards, pas le parcours DOM de chaque page (formulaires, modales, timeline).
   À compléter avec des tests RTL par page critique (OrderView, SavingsView, QR,
   décision banque).
6. **Pas de script `lint`** dans le projet : recommandé d'ajouter ESLint pour
   prévenir les régressions de style/naming.

## 8. Définition of Done — cases cochées

- [x] Application builds (`npm run build`)
- [x] Tests passent (`npm test` → 123/123)
- [x] Routes/guards testés (URL directe, rôle croisé)
- [x] Couche API et auth testées
- [x] États loading / error / empty testés
- [x] Valeurs financières issues du mock backend (source de vérité)
- [x] Actions critiques protégées du double-clic
- [x] Aucun secret exposé, aucune donnée sensible loggée
- [x] Aucun mock délai/flag laissé dans le code de production
- [x] Design system respecté (composants existants réutilisés, pas de styles aléatoires)