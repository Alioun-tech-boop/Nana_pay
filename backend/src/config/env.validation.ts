// src/config/env.validation.ts
import { z } from 'zod';

/**
 * Normalise une cle PEM.
 *
 * Les cles sont stockees avec des retours a la ligne echappes (`\n`) dans les
 * fichiers `.env` (dotenv les desechappe en local) et dans la plupart des
 * panneaux de variables d'environnement (Render, Vercel, Docker...). On accepte
 * donc les deux formes : retours a la ligne reels OU `\n` litteraux.
 */
function normalizePem(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.replace(/\\n/g, '\n').trim();
}

const pemBlock = z
  .string()
  .min(1)
  .refine((v) => v.includes('-----BEGIN') && v.includes('-----END'), {
    message: 'doit etre un bloc PEM valide (-----BEGIN ... -----END)',
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PRIVATE_KEY: z.preprocess(normalizePem, pemBlock), // RS256 private key (PEM)
  JWT_PUBLIC_KEY: z.preprocess(normalizePem, pemBlock), // RS256 public key (PEM)
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  ARGON2_MEMORY: z.coerce.number().int().default(65536),
  ARGON2_TIME: z.coerce.number().int().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().default(1),
  CORS_ORIGINS: z.string().min(1),
  RATE_LIMIT_TTL: z.coerce.number().int().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),
  HMAC_SECRET: z.string().min(32),
  MFA_ISSUER: z.string().default('NanaPay'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten());
    process.exit(1);
  }

  // Reinjecte les cles PEM normalisees : les consommateurs (JwtModule,
  // AuthService) lisent `process.env` / `ConfigService` et doivent obtenir des
  // retours a la ligne reels, quelle que soit la forme fournie.
  process.env.JWT_PRIVATE_KEY = result.data.JWT_PRIVATE_KEY;
  process.env.JWT_PUBLIC_KEY = result.data.JWT_PUBLIC_KEY;

  return result.data;
}
