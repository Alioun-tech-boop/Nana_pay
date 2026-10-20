// src/catalog/dto/catalog.query.ts
import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  categoryId: z.string().uuid().optional(),
  merchantId: z.string().uuid().optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
