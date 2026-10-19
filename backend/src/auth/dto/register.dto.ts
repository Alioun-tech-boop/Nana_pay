import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
