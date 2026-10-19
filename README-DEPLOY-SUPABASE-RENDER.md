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
| `CORS_ORIGINS` | Origines front autorisées | `http://localhost:5173` |

---

## 5. Déploiement Render (Blueprint)

1. **Render → New → Blueprint**, sélectionnez le dépôt.
2. Render lit `backend/render.yaml` et crée le service `nanapay-backend` (Docker, `frankfurt`, healthcheck `/healthz`).
3. Renseignez les variables marquées `sync: false` dans le dashboard :
   - `DATABASE_URL`, `DIRECT_DATABASE_URL` → copiez depuis `backend/.env`
   - `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `HMAC_SECRET` → copiez depuis `backend/.env`
   - `CORS_ORIGINS` → l'URL du frontend déployé (ex. `https://nanapay.netlify.app`)
   - `REDIS_URL` → URL Redis managée (ex. Upstash)
4. Déployez. Le healthcheck doit répondre : `https://<service>.onrender.com/healthz`

> ⚠️ Supabase bloque parfois les connexions directes hors pooler. Utilisez bien le **pooler** (6543 / 5432).

---

## 6. Connexion du frontend

Le frontend appelle `${VITE_NP_API_URL}${path}` (ex. `/auth/login`).

### Développement (proxy Vite)

`vite.config.ts` redirige `/api` → `http://localhost:3000`. Donc dans un `.env.development` local (gitignoré) :

```dotenv
VITE_NP_API_MODE=real
VITE_NP_API_URL=/api
```

### Production

```dotenv
VITE_NP_API_MODE=real
VITE_NP_API_URL=https://<service>.onrender.com/api
```

**Option recommandée — proxy Netlify (même origine, aucun CORS) :**

`netlify.toml` :

```toml
[build.environment]
  VITE_NP_API_MODE = "real"
  VITE_NP_API_URL = "/api"

# Proxy /api vers le backend Render (doit précéder le fallback SPA)
[[redirects]]
  from = "/api/*"
  to = "https://<service>.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Avec cette option, `CORS_ORIGINS` peut rester limité au domaine Netlify.

> ⚠️ **Le backend n'implémente aujourd'hui que l'authentification.**
> En mode `real`, seules les routes `/api/auth/*` répondent ; le reste renverra `404`.
> Laissez `VITE_NP_API_MODE=mock` tant que les modules métier ne sont pas développés.

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
