# NanoPay — Frontend (Lecture rapide)

> Version : 0.2
> **Statut actuel : implémenté en mode mock.** Les quatre espaces (CLIENT, MERCHANT, BANK, ADMIN) sont fonctionnels avec des données de démonstration isolées dans `src/api/mocks/`. Le backend REST n'existe pas encore ; le contrat API reste `[PROPOSED]` (`API-CONTRACT.md`).

---

## 1. Qu'est-ce que NanoPay Frontend ?

L'interface web de la plateforme fintech **NanoPay**, reliant **Client, Commerçant, Banque et Admin**, organisée autour **d'une commande centrale unique** :

```text
Client → Produit → Commande → Épargne/Coffre/Crédit → Financement → QR → Commerçant → Retrait → Paiement commerçant → Livraison
```

**Principe : le frontend est l'expérience. Le backend est la vérité.**

---

## 2. Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Vérifications locales
npm run typecheck

# Build de production
npm run build
```

### Variables d'environnement

| Variable | Usage | Exposée au navigateur |
|---|---|---|
| `VITE_API_URL` | URL racine du backend REST (mode réel) | Oui (publique) |
| `VITE_API_MODE` | `mock` (défaut) ou `real` | Oui (publique) |
| `VITE_APP_ENV` | `development / staging / production` | Oui (badge optionnel) |

**Aucun secret** dans les variables exposées au navigateur. Voir `SECURITY.md`.

### Comptes de démonstration (mot de passe : `correct`)

| Rôle | Identifiant |
|---|---|
| Client | `ada.doumbia@example.com` |
| Commerçant | `commercant@nanopay.demo` |
| Banque | `banque@nanopay.demo` |
| Admin | `admin@nanopay.demo` |

---

## 3. Stack

| Couche | Choix |
|---|---|
| Framework | React 19 |
| Bundler | Vite |
| Langage | TypeScript strict (`noUnusedLocals`, `noUnusedParameters`) |
| Routing | `react-router-dom` (BrowserRouter + `Route`/`Outlet`) |
| Data/fetch | Couches service + hooks `useRequest` / `useMutation` (pas de TanStack Query) |
| Formulaires | Formulaires natifs React + validation UX (pas de RHF/Zod) |
| UI | Design system propriétaire NanoPay (`src/design-system/`) |
| CSS | Tokens CSS variables (`--np-*`) + CSS modules |
| API | Client central `src/api/client.ts` → transport `mock` ou `real` |
| Tests | Aucun framework installé (Vérification : `typecheck` + `build`) |
| QR | `qrcode` |

---

## 4. Structure

```text
src/
├── api/                 # client central, transports (mock/real), mocks isolés
│   └── mocks/           # db.ts, proDb.ts, merchant.ts, bankAdmin.ts, auth.ts...
├── app/                 # entrée, router (App.tsx), AppShell, navigation par rôle
├── components/          # composants transverses (auth, client, pro, providers)
├── design-system/       # primitives UI + tokens (display, feedback, layout, money...)
├── features/            # feature slices par domaine
│   ├── auth/            # landing, login, register, verify
│   ├── marketplace/     # catalogue client
│   ├── financing/       # épargne / coffre / crédit (client)
│   ├── orders/          # commandes, détail, QR (client)
│   ├── dashboard/  profile/  history/  notifications/
│   ├── merchant/        # espace commerçant (10 pages)
│   ├── bank/            # espace banque (10 pages)
│   └── admin/           # espace admin (15 pages)
├── hooks/               # useRequest, useMutation, useIdempotencyKey
├── lib/                 # config, errors, dates, status, query, request-id
├── services/            # couche service par domaine (api.request uniquement)
├── stores/              # session (mémoire), panier
├── types/               # types de contrat par domaine
└── utils/
```

Règle d'architecture : `Component → Hook → Service → API Client → Backend`. **Aucun `fetch()` dans un composant.**

---

## 5. Documentation de référence

| Doc | Contenu |
|---|---|
| `ARCHITECTURE.md` | Architecture de référence (layers) |
| `ARCHITECTURE-ESSENTIALS.md` | L'essentiel non négociable (digest) |
| `API-CONTRACT.md` | Contrat REST cible (`[PROPOSED]`) |
| `DESIGN-SYSTEM.md` | Tokens, composants, guidelines |
| `PRODUCT-FLOW.md` | Parcours par rôle |
| `SECURITY.md` | Posture de sécurité frontend |
| `QA-CHECKLIST.md` | Scénarios de validation |
| `OPENCODE.md` | Instructions de développement |

---

## 6. Contribution & qualité

1. Lire les documents contractuels avant toute modification (AGENTS §2).
2. Ne **jamais** faire confiance à l'état frontend pour une vérité financière.
3. Passer par la couche `api`/services — pas de `fetch()` dans un composant.
4. Toute mutation d'argent : `ConfirmDialog` + `Idempotency-Key` + état `disabled` + validation backend.
5. Avant « done » : `typecheck`, `build`, revue visuelle mobile/desktop (AGENTS §60-62).