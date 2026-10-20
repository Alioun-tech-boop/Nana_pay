# NanaPay — Supabase + Render (guide de connexion sécurisée)

Ce guide décrit la configuration **réelle** mise en place pour connecter le backend NestJS à
**Supabase (PostgreSQL)** et le déployer sur **Render**.

> 🔒 **BACKEND = SOURCE DE VÉRITÉ.** Le frontend ne décide jamais d'un montant, d'un statut ou d'une autorisation.

---

## 1. État actuel

| Élément | Statut |
| --- | --- |
| Projet Supabase `Nana_pay` | ✅ `ACTIVE_HEALTHY` (ref `xhimrjzbqvpzhwtcibfe`, `eu-west-1`) |
| SSL base de données | ✅ enforced |
| Extension `citext` | ✅ installée |
| Schéma Prisma (24 tables / 12 enums) | ✅ appliqué |
| Mot de passe DB | ✅ rotaté (voir `backend/.env`) |
| Secrets JWT RS256 + HMAC | ✅ générés (voir `backend/.env`) |
| Backend déployable (Docker + Blueprint) | ✅ `backend/Dockerfile`, `backend/render.yaml` |
| Déploiement Render | ⬜ à lancer (étape 5) |
| Frontend basculé sur le backend réel | ⬜ à activer (étape 6) |

### Vérifications effectuées (local)

| Vérification | Résultat |
| --- | --- |
| Schéma Prisma (`npx prisma validate`) | ✅ **valide** (4 relations virtuelles corrigées) |
| Client Prisma (`npx prisma generate`) | ✅ v6.19.3 |
| Compilation (`npm run build`) | ✅ `dist/main.js` (23 fichiers) |
| Tests unitaires (`npm test`) | ✅ 1/1 |
| Validation d'environnement (runtime) | ✅ 16 variables requises |
| Secrets RS256 / HMAC | ✅ signature + vérification OK, HMAC 64 car. |
| Alignement DDL ↔ schéma | ✅ `prisma/init.sql` identique à la base appliquée |
| Connectivité base locale (`:6543`/`:5432`) | ⛔ **bloquée par le réseau de ce poste** → test end-to-end à faire sur Render |

---

## 2. Prérequis

- Un compte **Render**
- Le dépôt Git poussé (voir étape 7)
- Le contenu de `backend/.env` (contient le mot de passe DB et les clés JWT)
  > Ce fichier est **gitignoré**. Ne le commitez jamais.

---

## 3. Chaînes de connexion Supabase

Deux URLs distinctes (pratique officielle Supabase + Prisma) :

| Usage | Hôte | Port | Paramètres |
| --- | --- | --- | --- |
| **Runtime** (`DATABASE_URL`) | `aws-0-eu-west-1.pooler.supabase.com` | `6543` | `?pgbouncer=true&connection_limit=1&sslmode=require` |
| **Migrations** (`DIRECT_DATABASE_URL`) | `aws-0-eu-west-1.pooler.supabase.com` | `5432` | `?sslmode=require` |

Format :

```text
postgresql://postgres.xhimrjzbqvpzhwtcibfe:<MOT_DE_PASSE>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

> `<MOT_DE_PASSE>` se trouve dans `backend/.env` (variable `DATABASE_URL`).

---

## 4. Variables d'environnement backend

Copiez `backend/.env.example` vers `backend/.env` (déjà fait) puis renseignez :

| Variable | Rôle | Exemple |
| --- | --- | --- |
| `DATABASE_URL` | Pooler transaction (runtime) | `...:6543/...?pgbouncer=true&sslmode=require` |
| `DIRECT_DATABASE_URL` | Pooler session (migrations) | `...:5432/...?sslmode=require` |
| `REDIS_URL` | Rate limiting / sessions | `redis://localhost:6379` |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Signature RS256 (PEM, `\n` échappés) | généré |
| `HMAC_SECRET` | Signature QR / webhooks (≥ 32 car.) | généré |
| `CORS_ORIGINS` | Origines front autorisées | `https://moonlit-phoenix-2de61d.netlify.app` |

---

## 5. Déploiement Render (Blueprint)

> **État (2026-10-20) : service déployé et configuré.**
> - Service : `nanapay-api` → `https://nanapay-api.onrender.com`
> - Service id : `srv-dbbbqu3bc2fs73aka2i0` · region `frankfurt` · plan `free` · `rootDir=backend`
> - Healthcheck Render : `/healthz`
> - Les 7 variables `sync: false` **sont déjà injectées** (via l'API Render).
>
> ⚠️ Le nom `nanapay-backend` est occupé sur Render par un **autre compte** :
> `https://nanapay-backend.onrender.com` ne sert **pas** ce projet (empreinte
> `/health` + `{code,message,requestId}`). Ne jamais y pointer le frontend.

Pour recréer le service manuellement :

1. **Render → New → Blueprint**, sélectionnez le dépôt.
2. Render lit `backend/render.yaml` et crée le service `nanapay-api` (Docker, `frankfurt`, healthcheck `/healthz`).
3. Renseignez les variables marquées `sync: false` dans le dashboard :
   - `DATABASE_URL`, `DIRECT_DATABASE_URL` → copiez depuis `backend/.env`
   - `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `HMAC_SECRET` → copiez depuis `backend/.env`
   - `CORS_ORIGINS` → `https://moonlit-phoenix-2de61d.netlify.app`
   - `REDIS_URL` → URL Redis managée (ex. Upstash)
     (`REDIS_URL` est une variable obligatoire mais **aucune connexion n'est
     ouverte** : le rate limiting est en mémoire.)
4. Déployez. Le healthcheck doit répondre : `https://nanapay-api.onrender.com/healthz`

> ⚠️ Supabase bloque parfois les connexions directes hors pooler. Utilisez bien le **pooler** (6543 / 5432).

---

## 6. Connexion du frontend

Le frontend appelle `${VITE_NP_API_URL}${path}` (ex. `/auth/login`).

> **Frontend déployé :** `https://moonlit-phoenix-2de61d.netlify.app`
> **Backend déployé :** `https://nanapay-api.onrender.com` (`srv-dbbbqu3bc2fs73aka2i0`)

### Développement (proxy Vite)

`vite.config.ts` redirige `/api` → `http://localhost:3000`. Donc dans un `.env.development` local (gitignoré) :

```dotenv
VITE_NP_API_MODE=real
VITE_NP_API_URL=/api
```

### Production

**Option retenue — proxy Netlify (même origine, aucun CORS) :**

`netlify.toml` :

```toml
[build.environment]
  VITE_NP_API_MODE = "real"
  VITE_NP_API_URL = "/api"

# Proxy /api vers le backend Render (doit précéder le fallback SPA)
[[redirects]]
  from = "/api/*"
  to = "https://nanapay-api.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Le préfixe `/api` vient du proxy, pas du code applicatif : le backend utilise
`setGlobalPrefix('api')` et le healthcheck Render reste sur `/healthz`.

Avec cette option, `CORS_ORIGINS` peut rester limité au domaine Netlify. Le
backend accepte néanmoins `Idempotency-Key` dans ses en-têtes CORS, au cas où
le frontend serait pointé directement sur Render (cross-origin).

### Couverture réelle (2026-10-20)

| Module | État | Routes |
|---|---|---|
| Auth | ✅ | `/api/auth/register`, `/login`, `/refresh`, `/logout`, `/me` |
| Catalogue | ✅ **public** | `/api/products`, `/products/:id`, `/categories` |
| Commandes | ✅ | `/api/orders` (POST/GET), `/orders/:id`, `/orders/:id/status` |
| `/api/auth/verify` | ⛔ | Utilisé par l'écran `VerifyPage` après inscription — nécessite une table d'OTP + un canal de diffusion. **Non simulé.** |
| Épargne, Coffre, Crédit, Paiements, QR, Retraits, Marchand, Banque, Admin | ⛔ | Pas encore de routes — renvoient `404` en mode `real`. |

Voir `API-CONTRACT.md` §3/§4/§5 pour le détail de chaque contrat.

---

## 7. Vérification avant chaque déploiement

```bash
cd backend
npm run build
npm run smoke          # npm run smoke -- <chemin/.env>
```

`scripts/smoke-bootstrap.mjs` démarre `dist/main.js` contre une base
**volontairement injoignable** et vérifie que l'application valide l'environnement,
résout tous les modules, enregistre toutes les routes et atteint l'écoute HTTP.
Il ne touche à aucune base de données et sort par `0` (sain) ou `1` (régression).

C'est indispensable : plusieurs pannes de déploiement (« class-validator missing »,
`JwtService` non résoluble, `server.set is not a function`) ne se produisent
qu'en mode production et sont invisibles en `start:dev` et en `npm test`.

### Tests réels contre le service déployé

Vérifié le 2026-10-20 sur `https://nanapay-api.onrender.com` :

- `GET /healthz` → `200 {"status":"ok","database":"up"}`
- `POST /api/auth/register` → `201` (inscription par email **et** par téléphone)
- `POST /api/auth/login` → `200 {accessToken, refreshToken, user}` — `identifier` = email ou téléphone
- `POST /api/auth/refresh` → `200` pour un compte `PENDING_VERIFICATION`
- `GET /api/auth/me` → `200 {user}` ; sans jeton → `401`
- `GET /api/products` → `200` **sans jeton**
- `POST /api/orders` sans `Idempotency-Key` → `400 IDEMPOTENCY_KEY_REQUIRED`
- `POST /api/orders` ×2 avec la **même clé** → **même commande**, stock décrémenté **une seule fois**
- même clé, corps différent → `409 CONFLICT`
- préflight `OPTIONS` → `204` avec `Access-Control-Allow-Headers: …, Idempotency-Key`

---

## 7. Git (à faire)

```powershell
cd "C:\Users\EBOUEM Nathan\Downloads\Nana_pay"
git add backend BACKEND_AUDIT.md README-DEPLOY-SUPABASE-RENDER.md vite.config.ts
git status   # vérifier qu'aucun .env n'est inclus
git commit -m "feat(backend): connexion Supabase + sécurité (auth, prisma réel, docker/render)"
git push
```

> `.gitignore` exclut `.env` et `.env.*` (sauf `.env.example`). **Vérifiez avec `git status` avant de committer.**

---

## 8. Migrations Prisma (après le 1er déploiement)

Le schéma a été appliqué via l'API Management Supabase (le poste local ne peut pas joindre le port 5432/6543).
Pour versionner les migrations par la suite, exécutez depuis un réseau autorisé (ou depuis Render) :

```powershell
cd backend
npx prisma migrate dev --name init      # crée prisma/migrations + applique
npx prisma migrate deploy               # en production (CI/CD)
```

---

## 9. Sécurité — points clés

- 🔑 **Token Supabase** (`sbp_…`) partagé dans le chat → **révoquez-le** (Dashboard → Account → Access Tokens) et régénérez-en un nouveau si besoin.
- 🔐 **Mot de passe DB** rotaté : il n'existe que dans `backend/.env` et dans les variables Render. En cas de fuite, refaites `PATCH /v1/projects/{ref}/database/password`.
- 🧱 **CORS** strict (liste blanche d'origines, jamais `*`).
- 🚫 **API REST Supabase (PostgREST)** : la clé `anon` est publique par nature → les privilèges de `anon`/`authenticated` ont été **révoqués** et le **RLS activé** sur les 24 tables. Les données métier ne doivent passer que par l'API NanaPay.
- 🛡️ **Helmet** : CSP, HSTS, frameguard, noSniff.
- 🧾 **Aucun secret** dans le code front (le frontend est public).
- ⏯️ **Rate limiting** à activer avant mise en production (voir `BACKEND_AUDIT.md` §6).

---

## 10. Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `Environment variable not found: DIRECT_DATABASE_URL` | `DIRECT_DATABASE_URL` manquant | le définir (`.env` + Render) |
| `Can't reach database server` | pooler / SSL | vérifier `:6543` + `sslmode=require` |
| `prepared statement already exists` | pooler transaction sans `pgbouncer=true` | ajouter `?pgbouncer=true` |
| Healthcheck Render en échec | DB inaccessible | vérifier `DATABASE_URL` puis `/healthz` |
