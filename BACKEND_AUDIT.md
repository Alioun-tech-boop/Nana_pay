# NanaPay — Audit du Backend

> Périmètre : `backend/` (NestJS 10 + Prisma 6 + PostgreSQL/Supabase)
> Statut : **squelette d'authentification fonctionnel**, modules métier à construire.

---

## 1. Résumé exécutif

Le backend est un **vrai projet NestJS** (pas un mock), structuré sérieusement et orienté sécurité.
Cependant, il s'agit d'un **squelette** :

- ✅ Authentification réelle (`register` / `login` / `refresh` / `logout` / `me`)
- ✅ Cryptographie solide (Argon2id, RS256, AES-256-GCM, HMAC-SHA256)
- ✅ Schéma Prisma complet (**24 modèles**) appliqué sur **Supabase**
- ❌ **Aucun module métier** (Order, Savings, Vault, Credit, Payment, QR, Withdrawal, Settlement…)
- ❌ Rate limiting, MFA TOTP, idempotence serveur, audit hash-chain : **non implémentés**

> Règle rappelée : **BACKEND = SOURCE DE VÉRITÉ**. Le schéma est prêt, mais les endpoints métier restent à écrire.

---

## 2. Stack réelle

| Élément | Technologie |
| --- | --- |
| Framework | NestJS 10 (`@nestjs/core`, `@nestjs/common`, `@nestjs/jwt`) |
| ORM | Prisma 6 (`@prisma/client`, `prisma`) |
| Base | PostgreSQL 17 — **Supabase** (`eu-west-1`) |
| Hash mot de passe | `argon2` (Argon2id) |
| Validation | `zod` (+ `ZodValidationPipe`) |
| Sécurité HTTP | `helmet` (CSP, HSTS, frameguard, noSniff) |
| Divers | `uuid`, `rxjs` |

---

## 3. Ce qui fonctionne réellement

- **Auth**
  - `POST /api/auth/register` — création utilisateur (rôle `CLIENT`, statut `PENDING_VERIFICATION`)
  - `POST /api/auth/login` — vérification Argon2id + compteur d'échecs + verrouillage + détection MFA (drapeau)
  - `POST /api/auth/refresh` — **rotation** du refresh token + détection de réutilisation (`replacedByJti`)
  - `POST /api/auth/logout` — révocation de session
  - `GET /api/auth/me` — profil courant (ajouté)
- **Guards globaux** : `JwtAuthGuard` (RS256, issuer/audience vérifiés), `RolesGuard` (`@Roles(...)`)
- **Cryptographie** : Argon2id, AES-256-GCM (`encrypt`/`decrypt`), HMAC (`hmacSha256`/`hmacVerify`), SHA-256, `randomToken`
- **Erreurs** : `GlobalExceptionFilter` (jamais de stack technique exposée)
- **Logs** : `LoggingInterceptor`
- **Santé** : `GET /healthz` (hors préfixe `/api`) — vérifie la connexion PostgreSQL
- **Persistance** : `PrismaService` **réel** (`$connect`/`$disconnect`)

---

## 4. Corrections appliquées lors de cet audit

| Problème | Gravité | Correction |
| --- | --- | --- |
| `JwtAuthGuard` global **sans `@Public()`** sur `register`/`login`/`refresh`/`logout` → toutes les routes d'auth renvoyaient `401` | 🔴 Bloquant | `@Public()` ajouté |
| `PrismaService` était un **stub** (aucune persistance réelle) | 🔴 Bloquant | Remplacement par un vrai `PrismaClient` |
| `import * as cors from 'cors'` — paquet **absent** des dépendances | 🟠 Build | Import supprimé (inutilisé) |
| Aucun **préfixe global** `/api` → désalignement avec le frontend | 🟠 Bloquant | `app.setGlobalPrefix('api')` |
| `GET /auth/me` manquant (appelé par le front) | 🟠 Fonctionnel | Endpoint ajouté |
| `cors`/`UsePipes`/`Res` importés sans usage | 🟡 Propreté | Nettoyés |
| Schéma Prisma **invalide** : 4 relations sans champ opposé (`Merchant.user`, `Payment.savings`, `Notification.user`, `CreditProfile.requests`) | 🔴 Bloquant | Relations ajoutées / retirée → `prisma validate` ✅ |
| `@nestjs/config@^12` **incompatible** avec Nest 10 (`ERESOLVE`) | 🔴 Build | Aligné sur `@nestjs/config@^4.0.4` |
| `expiresIn: string` rejeté par `@types/jsonwebtoken` (`StringValue`) | 🟠 Build | Conversion en secondes (`parseTtl/1000`) |
| `TokenPair` non exporté (`TS4053`) | 🟠 Build | Interface exportée |

---

## 5. Dette technique restante (à construire)

| Domaine | État | Détail |
| --- | --- | --- |
| Modules métier | ❌ | `OrdersModule`, `SavingsModule`, `VaultModule`, `CreditModule`, `PaymentsModule`, `QRModule`, `WithdrawalsModule`, `SettlementsModule`, `NotificationsModule`, `AuditModule` |
| Rate limiting | ❌ | `RATE_LIMIT_*` validés mais aucun `@nestjs/throttler` branché |
| Redis | ⚠️ | `REDIS_URL` est **obligatoire** dans la validation d'env mais Redis n'est **utilisé nulle part** |
| MFA (TOTP) | ⚠️ | `mfaEnabled`/`mfaSecret` existent, aucune génération/vérification TOTP |
| Idempotence serveur | ⚠️ | Table `IdempotencyRecord` présente, aucun intercepteur qui stocke/rejoue |
| Audit tamper-evident | ⚠️ | Table `AuditEvent` présente (`previousHash`/`hash`), aucun service ne calcule la chaîne |
| Vérification email/téléphone | ❌ | Modèle présent, aucun envoi/vérification |
| Webhooks paiement | ❌ | Aucun contrôleur webhook + vérification HMAC |
| Tests | ⚠️ | Uniquement `app.controller.spec.ts` |

---

## 6. Risques de sécurité résiduels

1. **Pas de rate limiting** → brute-force sur `/auth/login` possible. **À activer avant prod.**
2. **Validation globale sans effet** : `ValidationPipe({ whitelist, forbidNonWhitelisted })` ne s'applique qu'aux classes `class-validator`. Ici les DTO sont des schémas Zod → le pipe global est inopérant pour les routes Zod.
3. **Refresh token** : stocké en SHA-256 simple. Recommandé : HMAC avec secret serveur ou Argon2 sur les tokens opaques.
4. **CORS** : `CORS_ORIGINS` doit être strict et limité au(x) domaine(s) de production (pas de `*`).
5. **Aucune autorisation métier** : `RolesGuard` existe mais aucun module ne l'exploite (`@Roles`).
6. **`trust proxy = 1`** : correct derrière Render, à ne pas ouvrir davantage.

---

## 7. Configuration Supabase réalisée

| Élément | Valeur |
| --- | --- |
| Projet | `Nana_pay` |
| Ref | `xhimrjzbqvpzhwtcibfe` |
| Région | `eu-west-1` |
| PostgreSQL | 17.11 |
| SSL | **enforced** (`database: true`) |
| Extensions | `citext` (requise par `User.email`), `pgcrypto`, `uuid-ossp` |
| Schéma | **24 tables / 12 enums / 31 FK / 110 index** appliqués |
| Exposition PostgREST | 🔒 `REVOKE ALL` sur `anon`/`authenticated` + **RLS activé** sur les 24 tables |
| Mot de passe DB | **rotaté** → voir `backend/.env` (non commité) |
| Runtime | Pooler **transaction** `:6543` (`pgbouncer=true`, `sslmode=require`) |
| Migrations | Pooler **session** `:5432` (`sslmode=require`) |

---

## 8. Definition of Done — backend

- [x] Structure NestJS propre, guards globaux, filtre d'erreurs, crypto
- [x] Base Supabase provisionnée (schéma complet)
- [x] Connexion sécurisée (SSL, secrets, pooler)
- [ ] Modules métier (Order → Savings/Vault/Credit → Payment → QR → Withdrawal → Settlement)
- [ ] Rate limiting + MFA TOTP + idempotence serveur + audit hash-chain
- [ ] Tests d'intégration (auth + flux financiers)
- [ ] `prisma migrate` versionné (migrations dans le dépôt)
