# NanaPay — Backend

API NestJS 10 + Prisma 6, connectée à **Supabase (PostgreSQL 17)**.

> 🧭 **BACKEND = SOURCE DE VÉRITÉ.** Le frontend ne calcule ni ne décide d'aucune valeur financière.

---

## Stack

- **NestJS 10** (`@nestjs/common`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/config` v4)
- **Prisma 6** (`@prisma/client`) — schéma : `prisma/schema.prisma`
- **PostgreSQL/Supabase** via pooler (`sslmode=require`)
- **Argon2id** (mots de passe), **JWT RS256** (access/refresh), **AES-256-GCM** + **HMAC-SHA256**
- **Helmet** (CSP, HSTS…), **Zod** (validation)

---

## Démarrage local

```bash
npm install
npx prisma generate      # ou : npm run db:generate
npm run start:dev
```

Le serveur écoute sur `http://localhost:3000`.
Le préfixe global est **`/api`** ; le healthcheck est **`/healthz`**.

> ⚠️ Certains réseaux bloquent les ports PostgreSQL (5432/6543). Si la connexion échoue localement,
> déployez sur Render (voir `../README-DEPLOY-SUPABASE-RENDER.md`).

---

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run start:dev` | Développement (watch) |
| `npm run build` | Compilation TypeScript (`dist/`) |
| `npm run start:prod` | Exécution production (`node dist/main.js`) |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma (dev) |
| `npm run db:migrate:deploy` | Applique les migrations (prod) |
| `npm test` | Tests unitaires |

---

## Endpoints implémentés

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | public | Création de compte |
| `POST` | `/api/auth/login` | public | Connexion (Argon2id) |
| `POST` | `/api/auth/refresh` | public | Rotation du refresh token |
| `POST` | `/api/auth/logout` | public | Révocation de session |
| `GET` | `/api/auth/me` | Bearer | Profil courant |
| `GET` | `/healthz` | public | Santé (DB) |

> Les modules métier (Orders, Savings, Vault, Credit, Payments, QR, Withdrawals, Settlements)
> **ne sont pas encore implémentés**. Voir `../BACKEND_AUDIT.md`.

---

## Variables d'environnement

Voir `.env.example`. Les secrets réels sont dans `.env` (**non commité**).

| Variable | Requis | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Pooler transaction `:6543` |
| `DIRECT_DATABASE_URL` | ✅ | Pooler session `:5432` (migrations) |
| `REDIS_URL` | ✅ (validé) | Rate limiting / sessions (branché plus tard) |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | ✅ | Paire RS256 (PEM, `\n` échappés) |
| `HMAC_SECRET` | ✅ | ≥ 32 caractères |
| `CORS_ORIGINS` | ✅ | Origines autorisées (liste blanche) |

---

## Sécurité

- Guards globaux : `JwtAuthGuard` + `RolesGuard`
- Rotation des refresh tokens + détection de réutilisation
- Helmet : CSP, HSTS, frameguard, noSniff
- Aucune stack technique exposée (`GlobalExceptionFilter`)
- ⏯️ **Rate limiting non encore activé** (voir audit §6)

---

## Déploiement

- Docker multi-stage : `Dockerfile` (utilisateur non-root, healthcheck `/healthz`)
- Blueprint Render : `render.yaml`
- Guide complet : `../README-DEPLOY-SUPABASE-RENDER.md`
