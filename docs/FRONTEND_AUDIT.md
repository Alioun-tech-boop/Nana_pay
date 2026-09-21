# NanoPay — Audit Frontend

> Version : 1.0
> Date : 2026-09-17
> Auteur : Lead Frontend Architect / Product Designer / UI Engineer / Security Engineer
> Périmètre : Repository `Nana_pay` — état du frontend à la date de l'audit
> Statut : **For review — aucun code modifié**

---

## 1. Résumé exécutif

L'audit complet du repository révèle un état **greenfield (phase 0)** :

- **Aucun code frontend n'existe.** Pas de `package.json`, pas de dossier `src/`, pas de composants, pas de tests, pas de build, pas de CI/CD.
- Le repository est un **scaffold de documentation** : 10 fichiers Markdown, dont **9 vides** et 1 partiellement rédigé (`ARCHITECTURE.md`, 54 lignes).
- Il n'y a **ni template SaaS, ni dashboard générique, ni UI générée par IA** à corriger — ce qui est une **opportunité** : l'identité visuelle et l'architecture seront construites from scratch, sans dette héritée.
- Le **risque principal** n'est donc pas la dette technique **existante** (nulle) mais la **dette contractuelle** : les spécifications (`DESIGN-SYSTEM.md`, `API-CONTRACT.md`, `PRODUCT-FLOW.md`, `SECURITY.md`, `README-FRONTEND.md`, `OPENCODE.md`, `ARCHITECTURE-ESSENTIALS.md`) sont des fichiers vides. Toute décision d'implémentation faite sans ces contrats sera coûteuse à corriger.

**Conclusion :** l'audit est un **audit d'architecture cible et de risque zéro-code**. Il qualifie l'état actuel, définit le socle cible conforme à l'architecture NanoPay, et sécurise les choix avant la première ligne de code. Aucune fonctionnalité hors périmètre NanoPay n'est proposée sans être explicitement marquée `[EXTENSION]`.

---

## 2. Inventaire de l'existant

| Fichier | Taille | Contenu |
|---|---|---|
| `ARCHITECTURE.md` | 2 214 o | Architecture de référence frontend (layers), principes de source de vérité backend |
| `AGENTS.md` | 0 o | **Vide** — à ce titre, aucune convention d'agents n'est définie |
| `API-CONTRACT.md` | 0 o | **Vide** — contrat API à rédiger |
| `ARCHITECTURE-ESSENTIALS.md` | 0 o | **Vide** |
| `DESIGN-SYSTEM.md` | 0 o | **Vide** — design system à rédiger |
| `OPENCODE.md` | 0 o | **Vide** |
| `PRODUCT-FLOW.md` | 0 o | **Vide** — parcours produits à rédiger |
| `QA-CHECKLIST.md` | 0 o | **Vide** — checklist QA à rédiger |
| `README-FRONTEND.md` | 0 o | **Vide** |
| `SECURITY.md` | 0 o | **Vide** — politique de sécurité à rédiger |

- Dossiers listés : aucun en dehors de la racine.
- Fichiers cachés (`.git`, `.env`, `.env.local`, `.DS_Store`) : **aucun**.
- Repository git : **non initialisé** (aucun historique, aucune branche, aucun `.gitignore`).

---

## 3. Diagnostique par axe initial demandé

### 3.1 Framework / Bundler / Routing / State / UI / CSS / Forms / API / Auth / Storage

Le diagnostic de chaque axe est : **non déterminé — rien n'existe**. Les cases ci-dessous captent l'état documentaire :

| Axe | État constaté |
|---|---|
| Framework | **Absent.** Aucun manifest (`package.json`, `pnpm-lock.yaml`, `bun.lockb`, `pubspec.yaml`, `requirements.txt`) |
| Bundler | **Absent.** Aucune config (`vite.config.*`, `webpack.*`, `next.config.*`, `rollup.config.*`, `tsconfig.json`) |
| Routing | **Absent.** Aucune route définie dans le code |
| State management | **Absent.** Aucun store, aucune librairie |
| Composants UI | **Absent.** Aucun composant |
| Système CSS | **Absent.** Aucune feuille de style, aucune configuration de tokens |
| Gestion formulaires | **Absent.** |
| Gestion API | **Absent.** `API-CONTRACT.md` vide |
| Authentification | **Absent.** `SECURITY.md` vide |
| Stockage local | **Absent.** |
| Dépendances | **Aucune.** Aucune liste de dépendances |
| Composants générés automatiquement | **Aucun** (rien à générer) |
| Dette technique | **Aucune dette de code.** Dette **contractuelle/process** importante (spécs vides) |
| Doublons | **Aucun** dans le code. Dans la doc : risque de doublon de périmètre entre `ARCHITECTURE.md` et `ARCHITECTURE-ESSENTIALS.md` non clarifié |
| Anti-patterns | **Aucun dans le code.** Dans la doc : `ARCHITECTURE.md` décrit une pile de layers sans définir les règles de circulation des données entre layers (risque d'anti-pattern `service-as-omniscience` ou de state dupliqué à l'implémentation) |

### 3.2 Templates SaaS / UI générée par IA / design sans identité

**Aucun template, dashboard générique, UI générée par IA, gradient excessif, carte inutile ou bouton générique n'existe** — il n'y a pas de code. Le seul document de cadrage visuel (`DESIGN-SYSTEM.md`) étant vide, le risque n'est **pas un héritage** mais une **dérive future** : sans tokens et sans composants de référence définis **avant** le code, l'implémentation aura tendance à introduire les anti-patterns visuels listés (gradients aléatoires, cards décoratives, boutons génériques). La section J verrouille ce risque.

### 3.3 Risques frontend

Les risques demandés (secrets exposés, tokens mal stockés, XSS, injection, unsafe HTML, données sensibles en `localStorage`, routes non protégées, permissions côté client, endpoints codés en dur, erreurs silencieuses, fuite de données entre rôles) sont tous à l'état **« risque futur potentiel »** : aucun code ne les matérialise aujourd'hui. Ils sont traités comme **contraintes non négociables** de l'architecture cible (sections E, H, K, L).

### 3.4 Préparation à une vraie API backend

L'`API-CONTRACT.md` étant vide, le frontend n'est **pas préparé**. `ARCHITECTURE.md` définit néanmoins le bon principe fondateur : *« le backend reste la source de vérité pour les données financières, permissions, rôles, commandes, paiements, crédits, statuts, QR, retraits, règlements marchands et règles métier critiques »*. Ce socle de principe est sain et devient la base du contrat (section K).

---

## A. Architecture actuelle

### A.1 Représentation du repository

```
Nana_pay/
├── AGENTS.md                    (vide)
├── API-CONTRACT.md              (vide)
├── ARCHITECTURE-ESSENTIALS.md   (vide)
├── ARCHITECTURE.md              (54 lignes — seul contenu)
├── DESIGN-SYSTEM.md             (vide)
├── OPENCODE.md                  (vide)
├── PRODUCT-FLOW.md              (vide)
├── QA-CHECKLIST.md              (vide)
├── README-FRONTEND.md           (vide)
└── SECURITY.md                  (vide)
```

### A.2 Modèle d'architecture documenté (seul « existant »)

`ARCHITECTURE.md` définit une pile à 7 couches :

```text
UI / Design System
Pages / Layouts
Features / Domains
Hooks / UI State
Services / Query Layer
API Client
Backend
```

Principes documentés :
- Frontend = expérience utilisateur et interaction.
- Backend = source de vérité métier, sécurité et permissions.
- Exigences produit : moderne, premium, fluide, rapide, sécurisée, accessible, responsive, connectable à un backend réel, cohérente entre **Client, Commerçant, Banque, Admin**.

### A.3 Périmètre produit NanoPay (rappel — source : mission, non couverte par le code)

Chaîne de commande centrale unique :
**Client → Produit → Commande → Épargne / Coffre / Crédit → Financement → QR → Commerçant → Retrait → Paiement commerçant.**

Quatre rôles : **Client, Commerçant, Banque, Admin.**

### A.4 Constats structurels

1. **Le frontend n'existe pas** : l'audit ne peut qualifier que des principes et des absences.
2. **9 spécifications critiques sont vides** : toute implémentation immédiate serait basée sur des hypothèses.
3. **Pas de boucle qualité** : pas de lint, pas de typecheck, pas de tests, pas de CI.
4. **Pas de versionnement** : repository git non initialisé, pas de `.gitignore`, risque de commit de secrets (`.env`, certificats, clés).
5. **Ambiguïté documentaire** : le rôle de `ARCHITECTURE-ESSENTIALS.md` vs `ARCHITECTURE.md` n'est pas défini (risque de divergence).

---

## B. Problèmes techniques

Le code étant inexistant, les problèmes techniques sont traités comme **problèmes anticipés d'implémentation** — à prévenir dès la phase de conception, pas à corriger :

| ID | Problème (anticipé) | Impact si non traité | Type |
|---|---|---|---|
| B-01 | Choix de stack non verrouillé (framework/bundler/language) | Lock-in, rework total, recrutement/compétences | Process |
| B-02 | Contrat API vide | Couplage frontend/backend spéculatif, rework des services et des types | Contractuel |
| B-03 | Design tokens absents | Style ad hoc, coût de réfonte, incohérence entre rôles | Contractuel |
| B-04 | Absence de typecheck de bout en bout (langage non typé ou types dupliqués) | Bugs de contrat API silencieux, régressions | Implémentation |
| B-05 | Absence de génération de clients API (OpenAPI/contract-first) | Dérive de contrat, endpoints codés en dur, types désynchronisés | Implémentation |
| B-06 | Pas de périmètre de tests défini | Confiance faible sur les flux financiers, régressions de parcours | Process |
| B-07 | Git/gitignore inexistants | Fuite de secrets, historique inutilisable pour les rollbacks | Process |
| B-08 | Pas d'environnements définis (dev/staging/prod) ni de gestion de config | Endpoints du mauvais environnement, secrets dans le bundle | Implémentation |
| B-09 | `ARCHITECTURE.md` ne définit pas les règles de flux de données entre layers | Couplage fragile, state dupliqué, services « omniscients » | Conception |
| B-10 | Modules transfrontaliers obligatoires (paiement, crédit, retrait) sans définition de domaine partagée | Duplication de logique entre rôles (ex. règles de montant affichées côté Client et côté Commerçant) | Conception |

---

## C. Problèmes UX

Aucun écran n'existe. Les problèmes UX sont des **exigences de conception expérience** pour garantir la progression perçue (« premium, fluide ») :

| ID | Problème (anticipé) | Exigence |
|---|---|---|
| C-01 | Flux financier à étapes multiples (commande → financement → QR → paiement) | Un **modèle d'état visuel clair** (pending / confirmed / funded / paid / settled) venant du backend, jamais déduit localement |
| C-02 | 4 rôles sur la même base | **Navigation par rôle** (shells distincts), zéro mécanisme d'ambiguïté de rôle côté UX |
| C-03 | Données d'argent critiques | **Formats monétaires unifiés** (symbole ISO 4217 + devise via `Intl`, jamais de concaténation manuelle) |
| C-04 | Erreurs possibles à chaque étape (échec financement, retrait bloqué, QR expiré) | **États vide/erreur/chargement/limite sur tous les écrans**, messages contextualisés par le backend (code + titre + détail) |
| C-05 | QR comme pivot produit | Écran QR **actionnable** : expiration, refresh, statut de scan, saut vers le résultat du paiement |
| C-06 | Sessions bancaires sensibles | **Sortie explicite** (logout), session bancaire « timed-out » annoncée, jamais de fin de session muette |

---

## D. Problèmes UI

Aucune UI n'existe. Les problèmes UI sont des **risques de dérive** à prévenir par le design system cible (section J) :

| ID | Risque | Contre-mesure cible |
|---|---|---|
| D-01 | Design sans identité (plusieurs rôles, un seul langage visuel absent) | Un **design system unique** avec thèmes fonctionnels par rôle, pas 4 looks différents |
| D-02 | Gradients et cartes décoratives | Palette de tokens **froide, financière** (blanc/bleu nuit/accent) ; les cartes uniquement pour regrouper des données, jamais décoratives |
| D-03 | Boutons génériques | 3 variantes sémantiques max (primaire / secondaire / ghost), états désactivé/chargement/erreur explicites |
| D-04 | Iconographie incohérente | Librairie d'icônes **unique** (skeuomorphe interdite), experience orientée hiérarchie typographique |
| D-05 | Typographie monétaire | Famille chiffres tabulaires (montants alignés), hiérarchie stricte (balance > actions > détails) |
| D-06 | Application multi-branches sans hiérarchie | **Layout rails-primaires** par rôle : sidebar (navigation) + top bar (contexte/session) + zone de contenu |

---

## E. Problèmes de sécurité

Aucun code à corriger. Les contraintes ci-dessous sont **non négociables** pour le frontend cible. Le mot d'ordre : *le frontend ne fait jamais confiance à sa propre mémoire*.

1. **Authentification** : échanges via **jetons à court cycle** (access + refresh, jamais de stockage du refresh dans le JS shell si possible). Aucun secret métier, aucune clé API, aucun mot de passe dans le bundle frontend.
2. **Stockage local** : interdiction de `localStorage` pour les données sensibles (jetons, données financières). Au pire des cas contrainte, jetons en mémoire uniquement + rotation ; les données financières doivent être requêtées, jamais mises en cache persistante.
3. **XSS / injection** : aucune insertion `dangerouslySetInnerHTML`/équivalent sans validation explicite (sanitization backend). Interpolation JSON désactivée par défaut.
4. **Permissions** : les rôles ne sont **jamais** une source d'autorisation côté frontend. Le backend renvoie le menu et les actions autorisées ; l'UI **masque visuellement** mais n'**autorise pas**.
5. **Routes** : protection **guard** côté page ET autorisation côté API. Une route accessible en UI sans droits doit être un bug de présentation, jamais une brèche — le backend la rejette.
6. **Endpoints** : aucune URL d'API en dur dans le code ; configuration par environnement (`import.meta.env` / `ENV`) et base URL unique.
7. **Fuites entre rôles** : séparation stricte des **contextes de requête** par rôle ; aucune donnée d'un rôle dans le state d'un autre ; pas de requêtes croisées non contrôlées.
8. **Erreurs silencieuses** : interceptor global d'API — jamais de `catch` vide ; retry borné + surface d'erreur. Les erreurs financières remontent au backend et à l'utilisateur.
9. **CSRF/CSRF-tokens** : gérés côté backend ; le frontend ne désactive jamais la politique CORS/Credentials par défaut.
10. **Secrets** : `.env*`, certificats et artifacts dans `.gitignore` dès le premier commit.
11. **QR** : le QR est un identifiant court de transaction, **jamais** un contenu financier brut ; expiration gérée backend.

---

## F. Problèmes de performance

Aucun code ; exigences cibles sur les flux financiers :

| Axe | Cible |
|---|---|
| Bundle | Code-splitting par rôle (Client, Commerçant, Banque, Admin) + routes paresseuses ; objectif < 180 Ko gzip initial |
| Chargement initial | Inlining des tokens CSS uniquement, suppression des librairies d'icônes entières (SVG on-demand) |
| Réseau | Requêtes d'API typées et **dédoublonnées** (query cache dédié), refetch sur invalidation, jamais de polling systématique |
| Forfaits monétaires | Calculs lourds interdits côté client ; toute valeur affichée provient du backend (avoid mis-rendu) |
| Images | Format moderne (AVIF/WebP), lazy-loading, tailles responsives |
| UX fluide | Interactions optimistes **uniquement sur les états non-financiers** ; les actions d'argent attendent la confirmation backend |
| Core Web Vitals | LCP < 2,5 s, INP < 200 ms, CLS < 0,1 sur les parcours critiques |

---

## G. Problèmes d'accessibilité

Contraintes cibles (aucun code n'existe) :

1. **Hiérarchie et sémantique** : landmarks `<header>`, `<nav>`, `<main>`, niveaux de titres cohérents, focus visible sur toute l'app.
2. **Formulaires bancaires** : labels associés, erreurs annoncées (`aria-live` / `role="alert"`), messages d'erreur liés aux champs, autocomplete correct pour les données personnelles.
3. **Navigation clavier complète** : modales, drawers, toasts, QR player navigables et fermables au clavier.
4. **Contraste** : ≥ 4,5:1 sur les textes, ≥ 3:1 sur les composants (les montants en niveaux de gris interdits).
5. **Réduction de mouvement** : respect de `prefers-reduced-motion`.
6. **Données monétaires pour lecteurs d'écran** : montants lus avec devise et précision (`aria-label`), ne jamais se fier à la seule typographie tabulaire.
7. **Cible tactiles** ≥ 44 px sur les actions critiques (payer, retirer, valider).
8. **Internationalisation** : devise, formats numériques et direction de lecture préparés via `Intl`.

---

## H. Architecture cible

### H.1 Stack verrouillée (recommandation)

```
Framework          : React 19 (rendu et interopérabilité, écosystème + recrutement)
Bundler            : Vite (dev ultra-rapide, exports de tokens CSS)
Language           : TypeScript strict (types = contrat avec l'API)
Routing            : React Router v7 (data loaders pour le rôle/guard + chargement par page)
State serveur      : TanStack Query (cache d'API typé, invalidation, retry borné)
State client brut  : Zustand ou context minimaux (UI shell, session en mémoire)
Formulaires        : React Hook Form + Zod (validation UX côté client UNIQUEMENT — la règle métier reste backend)
UI                 : Design system propriétaire NanoPay (section J) — composants maison, pas de template
CSS                : CSS Modules + Design Tokens (custom properties), zéro framework CSS obscur
API client         : OpenAPI (spec contract-first) + client généré (types compilés) + interceptor
Tests              : Vitest (unit) + React Testing Library (composants) + Playwright (e2e des 4 rôles + parcours QR)
Lint/Format        : ESLint + Prettier (gardes CI)
```

> Les choix d'outils sont des recommandations d'architecte. Ce qui est **contractuel** (non négociable) : TypeScript strict, contract-first avec OpenAPI, source de vérité backend, design system maison. Les outils concrets peuvent être réajustés après validation.

### H.2 Pile de dossiers (alignée sur `ARCHITECTURE.md`)

```text
src/
├── app/                 # entrée, providers globaux, router
├── core/                # tokens, theme, utils (monnaie, dates), erreurs, types canoniques
├── shared/              # composants UI (design system), hooks génériques, guards, api-client
├── features/
│   ├── auth/            # session, login, refresh, logout, guards de rôle
│   ├── client/          # parcours Client
│   ├── merchant/        # parcours Commerçant
│   ├── bank/            # parcours Banque
│   └── admin/           # parcours Admin
├── services/            # couche query (par domaine : orders, savings, vault, credit, funding, qr, withdrawals, payments)
└── __tests__/           # tests unit + e2e
```

Correspondance couches `ARCHITECTURE.md` :

| Couche ARCHITECTURE.md | Dossier cible |
|---|---|
| UI / Design System | `core/`, `shared/` |
| Pages / Layouts | `app/`, `features/*/pages` |
| Features / Domains | `features/*` |
| Hooks / UI State | `shared/hooks`, `features/*/hooks` |
| Services / Query Layer | `services/` |
| API Client | `shared/api-client` (`core/api`) |
| Backend | — (externe) |

### H.3 Découplage des domaines (le flux central NanoPay)

| Domaine | Responsabilité frontend (uniquement) | Source de vérité |
|---|---|---|
| Produit | Catalogue, sélection | Backend |
| Commande | Création, statut, suivi | Backend |
| Épargne | Affichage, souscription (== commande) | Backend |
| Coffre | Affichage, solde, contenu | Backend |
| Crédit | Simulation d'affichage SEULEMENT, souscription (== commande) | Backend |
| Financement | Affichage du statut, acceptation | Backend |
| QR | Rendu du QR (données fournies par le backend), état d'expiration | Backend |
| Commerçant | Scan, validation d'un paiement, caisse | Backend |
| Retrait | Demande, suivi | Backend |
| Paiement commerçant | État final, reçus | Backend |

> Toute « simulation » visible (taux de crédit, mensualités, montant épargné projeté) doit être **servie ou validée par le backend** et affichée avec mention « indicatif — sous réserve de validation ».

### H.4 Flux de données standard (règle à appliquer)

```
Écran → (validation UX Zod uniquement) → service/query → API client (token + env) → backend
                                                                      │
Backend → réponse typée/statuts → query cache → UI (formats monétaires via Intl) → états (loading/success/error)
```

Règles :
- Le **seul** ordre légitime de mutation d'argent est un appel API ; aucune mutation de montant en local.
- Les statuts proviennent **toujours** du backend (never inferred from UI state).
- Un écran ne connaît jamais le rôle d'un autre rôle ; pas de partage de state croisé.

### H.5 Environnements

- `dev` / `staging` / `prod` via variables d'environnement type-checkées.
- Base URL unique par environnement ; aucune URL codée en dur. `.env*` dans `.gitignore`.

---

## I. Plan de refactoring

N'étant pas **refactoring** mais **construction**, le plan est un **plan de mise en place contractuelle** ordonné pour éviter la dette. L'objectif : écrire la partie 1 (contrats) avant toute ligne de composant.

### Phase 0 — Socle contractuel (constitue le « refactoring » des specs vides)
1. Rédiger `API-CONTRACT.md` : endpoints, schémas, statuts, erreurs, auth, idempotence (contrat sp-scope sur la source de vérité backend).
2. Rédiger `DESIGN-SYSTEM.md` : tokens (couleur, type, espacement, rayons, ombres), composants, guidelines.
3. Rédiger `PRODUCT-FLOW.md` : parcours par rôle via le flux central (Client → … → Paiement commerçant).
4. Rédiger `SECURITY.md` : politiques S-E-1…S-E-11, rotation, sanitization.
5. Rédiger `README-FRONTEND.md` : runbook dev/staging/prod.
6. Rédiger `QA-CHECKLIST.md` : scénarios par rôle + réglementaire.
7. Initialiser git, `.gitignore` (`.env*`, `node_modules/`, `dist/`, logs), **zero secrets commité**.
8. Clarifier le périmètre de `ARCHITECTURE-ESSENTIALS.md` vs `ARCHITECTURE.md` (fusion ou responsabilité unique).

### Phase 1 — Squelette technique
9. Scaffold React + TS strict + Vite.
10. ESLint + Prettier + scripts `lint` / `typecheck` (verrouillage CI).
11. API client de base : fetch wrapper + intercepteurs + gestion d'erreur typée + base URL par env.
12. Design tokens CSS + variables + typographie chiffres tabulaires.

### Phase 2 — Coquille multi-rôles et auth
13. Layouts par rôle (Client / Commerçant / Banque / Admin), routing, guards.
14. Session : login (Jetons), refresh, logout, expiration, refresh en mémoire, pas de `localStorage` pour les jetons.
15. Systema d'erreurs global (code + titre + détail, rétry borné).

### Phase 3 — Domaines du flux central (par incrément)
16. Produit → Commande (fonctions communes aux 4 rôles : liste, détail, statut).
17. Épargne / Coffre / Crédit (affichage non-mutateur d'abord ; souscriptions par Commande).
18. Financement → QR (rendu QR depuis données backend, compteur d'expiration, états).
19. Commerçant (scan/validation paiement, caisse) puis Retrait puis Paiement commerçant.

### Phase 4 — Tests et qualité de production
20. Unit + composants (Vitest/RTL) sur les règles affichées.
21. Playwright e2e : parcours complet par rôle + parcours QR + scénarios d'expiration + scénarios d'interdiction de rôle.
22. Audit Lighthouse + axe (accessibilité) dans CI.

### Phase 5 — Durcissement
23. Revues sécurité (rotation, sanitization, ordre des requêtes), taille de bundle (< 180 Ko), readiness checklist section L.

---

## J. Design system cible

Identité propriétaire « NanoPay » — positionnement : **fintech de confiance, sombre et précise**. Pas de template, pas de kit générique.

### J.1 Principes
- **L'argent est silencieux-paisible** : fonds clairs et sobres, accents limités.
- **La confiance est structurelle** : typographie nette, espaces généreux, hiérarchie stricte, chiffres tabulaires.
- **Un seul langage visuel pour 4 rôles** : thèmes par rôle = variations de tokens fonctionnels, jamais de re-design par branche.

### J.2 Tokens fondamentaux (base, à calibrer en implémentation)

| Token | Valeur indicative (non figée avant validation) |
|---|---|
| Primitive — fond | `#FFFFFF`, `#F6F8FA`, `#0B1220` (nuit profonde) |
| Primitive — accent | Bleu financier `#0A4DA3`…`#0F6BD6` (gammes) |
| Primitive — crédit | Teinte distincte pour crédit/financement (ex. in-défini) |
| Statuts | `success` / `warn` / `danger` / `neutral` strictement sémantiques (montants en `neutral`/`success`, rejet en `danger`) |
| Type scale | 12-14-16-20-28-36 (rem base 4 px), famille chiffres tabulaires (`font-variant-numeric: tabular-nums`) |
| Espacement | échelle 4-8-12-16-24-32-48 |
| Radius | 6-10-14 (moyen) — pas de pill excessif |
| Ombres | 2 niveaux max (élévation douce, jamais de halo coloré) |
| Motion | 150-200 ms, `ease-out`, désactivable (prefers-reduced-motion) |

### J.3 Composants cibles (uniquement ceux couverts par le périmètre)

- **Primitives** : `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `FieldError`, `Badge`, `Skeleton`, `Tooltip`.
- **Feedback** : `Toast`, `InlineAlert`, `ConfirmDialog`, `StatusPill` (statuts de commande/paiement/retrait venant du backend), `EmptyState`, `ErrorState`.
- **Montants** : `Amount` (Intl, devise, tabular-nums), `MoneyInput` (saisie décimale verrouillée).
- **Domaines** : `OrderCard`, `OrderSummary`, `VaultCard`, `SavingsCard`, `CreditSimulation` (indicatif), `QrDisplay` (QR + expiration + refresh), `ScanSurface` (Commerçant), `WithdrawalForm`, `PaymentReceipt`, `BankDashboardCard`, `AdminTable` (audit/règlements).
- **Nav** : `RoleNav` (sidebar par rôle), `TopBar` (session, logout, contexte), `Tabs`.

### J.4 Guideline d'usage
- Chaque composant possède : variantes, états (default/hover/focus/disabled/loading/error), contrat de props typées, tests RTL obligatoires, pas de `any`.
- **Interdit** : gradients décoratifs, emojis dans l'UI, shadows exubérantes, cartes sans contenu, boutons « génériques », icônes skeuomorphes.

---

## K. Architecture API cible

### K.1 Principes (contract-first)

1. **OpenAPI 3.1** (`API-CONTRACT.md` formalise le spec ou pointe vers le fichier `openapi.yaml`).
2. **Client généré** depuis le spec (types compilés) : aucun type API écrit à la main dans le frontend.
3. **IDEMPOTENCE** : toutes les mutations d'argent portent un `Idempotency-Key` — obligatoire pour Épargne/Coffre/Crédit, Financement, Retrait, Paiement.
4. **Statuts normalisés** : enum de statuts fournie par le backend, mappée 1:1 par `StatusPill`.
5. **Erreurs structurées** : `{ code, title, detail, field? }` — pas de messages bruts en anglais dans l'UI, mapping vers texte localisé côté UI.

### K.2 Contrat minimal (pré-projet) — regroupé par domaine du flux NanoPay

> Chaque endpoint ci-dessous est **hypothèse de contrat à valider dans `API-CONTRACT.md`** (rien n'est codé). Aucun endpoint n'est requis pour exister hors des domaines NanoPay.

| Domaine | Opérations attendues |
|---|---|
| Auth / Session | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Produit | `GET /products`, `GET /products/:id` |
| Commande | `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /orders/:id/status` |
| Épargne / Coffre / Crédit | `GET /savings`, `POST /savings`, `GET /savings/:id`, `GET /vault`, `GET /vault/:id`, `GET /credit/eligibility`, `POST /credit` |
| Financement | `GET /fundings/:orderId`, `POST /fundings/:orderId/accept`, `POST /fundings/:orderId/reject` |
| QR | `POST /orders/:id/qr`, `GET /orders/:id/qr/status` (expiration incluse) |
| Commerçant | `POST /qr/scan` (validation d'un QR), `GET /merchant/transactions`, `GET /merchant/balance` |
| Retrait | `POST /withdrawals`, `GET /withdrawals`, `GET /withdrawals/:id` |
| Paiement commerçant | `POST /payments/settle`, `GET /payments/:id` |
| Admin | `GET /admin/orders`, `GET /admin/payments`, `GET /admin/merchants`, `GET /admin/audit` |

### K.3 Sécurité du contrat API côté frontend

- Jetons via header `Authorization: Bearer` (pas de query param).
- Refresh rotatif, jetons access courts (15 min conseillé), refresh hors `localStorage`.
- Pas de `fetch` nu — un seul module `apiClient` (intercepteurs : auth, retry borné, normalisation d'erreurs, logging non-sensitif).
- Timeouts explicites, abort sur démontage de composant.
- Aucune donnée financière mise en cache persistante ; cache mémoire uniquement avec invalidation.

---

## L. Checklist de production

Validation de **non-régression** et de **conformité** avant livraison — à transformer en `QA-CHECKLIST.md` + CI :

### Sécurité
- [ ] Aucun secret dans le code ni dans l'historique git (`.gitignore` vérifié).
- [ ] Aucun jeton dans `localStorage`/`sessionStorage` ; jetons en mémoire + rotation.
- [ ] Aucun `dangerouslySetInnerHTML` / en-tête d'HTML non sanitized.
- [ ] Aucune URL d'endpoint en dur ; config par environnement uniquement.
- [ ] Guards de rôle : masquage UI ET rejet backend (vérifié en e2e).
- [ ] Aucune mutation d'argent sans `Idempotency-Key`.
- [ ] Aucun `catch` silencieux croisé sur les flux financiers (interceptor).
- [ ] Refresh/logout fonctionne sur expiration de session (testé).
- [ ] Aucune donnée d'un rôle présente dans le state d'un autre rôle (revue de code).

### Conformité contractuelle
- [ ] Tous les types frontend générés depuis le spec OpenAPI (aucun type écrit à la main).
- [ ] Statuts affichés uniquement depuis le backend (enum mappée).
- [ ] Aucune règle métier critique dupliquée côté client (revue).

### Fonctionnel (par rôle)
- [ ] Parcours Client complet : produit → commande → épargne/coffre/crédit → financement → QR → statut paiement.
- [ ] Parcours Commerçant : scan QR → validation → retrait → règlement payé.
- [ ] Parcours Banque : revue financements, ordres, règlements.
- [ ] Parcours Admin : supervision, statuts, audit.
- [ ] Tests d'expiration de QR et d'idempotence (double-clic).

### UX / UI / Accessibilité
- [ ] États loading/error/empty sur tous les écrans critiques.
- [ ] `prefers-reduced-motion` respecté.
- [ ] Contraste ≥ 4,5:1 ; focus visible ; navigation clavier complète.
- [ ] Montants avec tabular-nums et devise ISO.
- [ ] Lighthouse CI : perf ≥ 90, a11y = 100, best-practices ≥ 90.
- [ ] Bundle gzip initial < 180 Ko (code-splitting par rôle).

### Performance
- [ ] Aucun polling systématique ; caching dédié + invalidations.
- [ ] LCP < 2,5 s / INP < 200 ms / CLS < 0,1.

### Qualité/Process
- [ ] `lint` + `typecheck` + tests unitaires + e2e passent en CI.
- [ ] Revue des 4 fiches contractuelles (`API-CONTRACT`, `DESIGN-SYSTEM`, `PRODUCT-FLOW`, `SECURITY`) signée avant Phase 1.

---

## Annexe 1 — Table des exigences sans implémentation (registre des risques fermés)

| Réf. | État | Décision |
|---|---|---|
| B-01 → B-10 | En attente de définition | Traité en phase 0 (choix de stack, contrats) |
| C-01 → C-06 | En attente de design | Pris en charge par design system + `PRODUCT-FLOW.md` |
| D-01 → D-06 | En attente de design | Verrouillé par la section J (tokens + composants) |
| E-01 → E-11 | Contraintes actées | Bloquantes pour Phase 1 — à inscrire dans `SECURITY.md` |
| F (perf) | Contraintes actées | À vérifier en CI (Lighthouse, bundle) |
| G (a11y) | Contraintes actées | À vérifier en CI (axe, clavier) |

## Annexe 2 — Fonctionnalités proposées au-delà du périmètre NanoPay documenté

Aucune fonctionnalité produit nouvelle n'est proposée. Les seules extensions identifiées sont **techniques**, nécessaires à un frontend de production et non couvertes par la mission :

| Extension technique | Justification | Marque |
|---|---|---|
| Interaction branchée sur jetons de session + refresh | Nécessaire pour la sécurité d'accès ; aucun workflow d'auth défini | `[EXTENSION]` |
| Gestion des environnements dev/staging/prod | Condition de connexion à un backend réel | `[EXTENSION]` |
| Tests e2e multi-rôles (Playwright) | Garantie de non-fuite entre rôles | `[EXTENSION]` |
| Idempotence-Key sur mutations d'argent | Garantie de sûreté des paiements (aucun double débit) | `[EXTENSION]` |
| Registre d'audit/console admin | Le rôle Admin existe dans le périmètre ; l'étendue exacte de sa supervision à confirmer | `[EXTENSION]` (à valider) |

---

*Fin de l'audit — aucune modification de code. La suite demandée par l'architecte : validation des recommandations (Phase 0 contractuelle) avant tout scaffold.*