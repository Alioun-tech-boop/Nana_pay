# Performance — NanoPay Frontend

Ce document décrit les règles de performance du frontend NanoPay et les mesures mises en œuvre.

## 1. Principe

La performance fait partie du produit :

- premier rendu rapide, même en connexion mobile moyenne ;
- pas d’appels API inutiles ou dupliqués ;
- pas de waterfall inutile ;
- pas de polling agressif ;
- les données financières ne sont **jamais** servies depuis un cache.

## 2. Budget de référence (build de production)

| Mesure | Avant | Après |
| --- | --- | --- |
| JS total (brut) | ~666,8 kB | découpé en chunks |
| JS total (gzip) | ~179,2 kB | découpé en chunks |
| JS chargé au premier écran (gzip) | ~179,2 kB | ~134,3 kB (`index` + `react-vendor` + `vendor`) |
| JS restant | — | chargé à la volée par route (`React.lazy`) |
| CSS initial (gzip) | ~19,3 kB | ~13,8 kB (+ CSS par page, chargé avec son chunk) |

Toutes les routes ne sont **pas** dans le bundle initial : chaque page de fonctionnalité est un chunk séparé chargé à la demande.

Vérifier avec : `npm run build`.

## 3. Code splitting

- Toutes les routes sont découpées via `React.lazy` (`src/app/lazy.tsx`, helper `lazyPage`).
- L’entrée garde uniquement : le shell (`AppShell`), l’authentification, le routage et le fournisseur d’app.
- `AppShell` reste chargé immédiatement : la navigation/le shell restent montés pendant le chargement d’une page.
- Les pages authentification/accueil (`/`, `/login`) restent eager pour un premier peintre rapide.
- Chunk de pages volumineuses : `DesignSystemPage`, espaces MERCHANT/BANK/ADMIN, `financing`, `orders`.
- Vendors séparés (`vite.config.ts` → `manualChunks`) : `react-vendor` (react/react-dom/router) et `vendor` → meilleur cache navigateur.
- Fallback de chargement : squelette contenu-spécifique (`src/app/routeFallback.module.css`) plutôt qu’écran vide.

Règle : une nouvelle page doit être enregistrée via `lazyPage(...)`, sauf exceptions justifiées (accueil, login).

## 4. Stratégie de cache API

Couche `src/api/client.ts`.

### 4.1 Cache opt-in, jamais pour les données financières

- Seules les requêtes `GET` avec `cache: { ttlMs }` dans la config sont mises en cache, en mémoire.
- Jamais de cache sur :
  - commandes, panier de commande, épargne, coffre, crédit, paiements, retraits, QR, soldes ;
  - prix de produits (le prix affiché doit toujours être frais) ;
  - toute donnée utilisée pour une décision financière.
- Le cache est invalidé automatiquement :
  - `clearCache()` à la connexion et à la déconnexion / expiration de session (aucun risque de fuite entre comptes) ;
  - `invalidateCache(pathPrefix)` après une mutation qui change la ressource.

### 4.2 Ce qui est en cache

| Service | Path | TTL | Invalidation |
| --- | --- | --- | --- |
| `marketplaceService.getMerchants` | `/merchants` | 60 s | session |
| `marketplaceService.getMerchant` | `/merchants/:id` | 60 s | session |
| `marketplaceService.getMerchantMeta` | `/merchants/meta` | 60 s | session |
| `notificationService.getSummary` | `/notifications/summary` | 15 s | `markAsRead` / `markAllAsRead` (`invalidateCache('/notifications')`) |

Cela supprime les doublons de chargement marketplace → boutique → produit (la fiche boutique est déjà en cache), sans jamais servir un montant financier périmé.

### 4.3 Pas de serveur de vérité côté client

Rappel du principe central : `BACKEND = SOURCE OF TRUTH`. Le cache ne concerne que des métadonnées de catalogue et de notification. Toute donnée financière doit être re-fetchée selon les besoins de cohérence (voir `useQrStatus` ci-dessous).

## 5. Réseau

### 5.1 Polling

- Le seul polling est le statut QR (`useQrStatus`) : 1 appel / 5 s, maximum 30 appels, arrêt automatique sur état terminal (`WITHDRAWN`, `SETTLED`, `EXPIRED`). Comportement borné et voulu.
- Pas de refetch au focus de fenêtre : cela rafraîchirait inutilement des données financières.
- Les pages parallélisent leurs requêtes (ex. marketplace charge meta + marchands + produits en parallèle, `Promise`-free via `useRequest` multiples).

### 5.2 Abort

`useRequest` annule la requête en cours lors du démontage/du changement de dépendances. Toute charge superflue est stoppée.

## 6. Images

- Les images du catalogue sont rendues avec `loading="lazy"` + `decoding="async"` (`ProductCard`, `Avatar`).
- Dimensions explicites (`width`/`height`) lorsque connues : évite le layout shift (le conteneur média a déjà `aspect-ratio`).
- Les mocks produits ne contiennent pas d’images réelles (`images: []`) : placeholders d’icônes, aucun `<img>` vides chargé.
- Règle : toute image future doit fournir `url` + dimensions, et être servie en format optimisé côté backend (WebP/AVIF, dimensions adaptées).

## 7. Polices

- Polices variables via `@fontsource-variable` (`inter`, `schibsted-grotesk`) + `ibm-plex-mono` statiques.
- Les fichiers présents dans `dist` couvrent tous les subsets (cyrillique, vietnamien…), mais le navigateur ne télécharge que les subsets dont `unicode-range` a besoin (jusque latin + latin-ext pour le français). Pas de coût au premier chargement pour une locale fr.
- Ne pas charger de polices supplémentaires sans justification.

## 8. Icônes

- `Icon` utilise un registre central (`src/design-system/icons/paths.tsx`). Le nome icon n’est pas arbre-découpable par icône en l’état : acceptable, documenté. Si la consommation monte, basculer sur des imports par icône.

## 9. États de chargement

- Chaque opération asynchrone a un état `LOADING` explicite (skeletons contenu-spécifiques, ex. `ProductPage`, `MarketplacePage`).
- Le passage de page affiche un squelette (`RouteFallback`) pendant le chargement du chunk.
- Pas d’optimistic update sur les actions financières : les états sont `pending` / `processing` / `confirmed` / `failed` reflétés depuis le backend.

## 10. Mesures / vérification

- Construire : `npm run build`.
- Typecheck : `npm run typecheck`.
- Inspecter la sortie de build : vérifier qu’`index` + `react-vendor` restent légers, que chaque page a son chunk.
- DevTools → Network : filtrer les appels dupliqués (marketplace → produit ne doit pas recharger les marchands si dans le TTL).
- DevTools → Performance : vérifier l’absence de longues tâches bloquantes sur mobile + throttling.
- Lighthouse mobile : premier peintre et Largest Contentful Paint corrects.

## 11. Checklist de non-régression

- [ ] Pas de données financières servies depuis le cache.
- [ ] Pas d’optimistic update sur paiement / crédit / retrait / QR.
- [ ] Le statut QR reste borné (5 s / 30 max).
- [ ] Aucune URL API en dur dans les composants.
- [ ] Aucun `console.log` de données sensibles.
- [ ] Les routes passent par `lazyPage` (sauf entrée/auth).
- [ ] `npm run typecheck` et `npm run build` passent.