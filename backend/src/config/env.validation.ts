// src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1), // RS256 private key (PEM)
  JWT_PUBLIC_KEY: z.string().min(1),   // RS256 public key (PEM)
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

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten());
    process.exit(1);
  }
  return result.data;
}
