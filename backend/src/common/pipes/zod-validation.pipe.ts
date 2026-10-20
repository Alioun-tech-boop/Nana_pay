// src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Valide les entrées avec Zod et produit une erreur exploitable par le frontend
 * (client.ts -> buildError lit `detail` + `field`).
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || null,
        message: issue.message,
      }));
      const first = issues[0];

      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: first?.message ?? 'Données invalides.',
        field: first?.field ?? null,
        errors: issues,
      });
    }
    return result.data;
  }
}
