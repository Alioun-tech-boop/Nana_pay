// src/auth/dto/login.dto.ts
import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  mfaCode: z.string().length(6).optional(),
  deviceFingerprint: z.string().max(256).optional(),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
