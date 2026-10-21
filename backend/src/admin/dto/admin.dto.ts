// src/admin/dto/admin.dto.ts
import { z } from 'zod';

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  q: z.string().optional(),
  status: z.string().optional(),
});

export type AdminQuery = z.infer<typeof adminQuerySchema>;
