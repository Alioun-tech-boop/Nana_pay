// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Le frontend (src/api/client.ts -> buildError) lit exactement :
 *   { code, title, detail, field }
 * On fournit ces champs en plus de statusCode/traceId/timestamp, sans jamais
 * exposer de detail interne (stack, SQL, message brut Prisma...).
 */

const TITLES: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Authentification requise',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: 'Conflit',
  422: 'Opération refusée',
  429: 'Trop de requêtes',
  500: 'Erreur serveur',
  503: 'Service indisponible',
};

const DEFAULT_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'UNAVAILABLE',
};

interface NormalizedError {
  code: string;
  title: string;
  detail: string;
  field: string | null;
  errors: unknown[] | null;
}

/** Extrait un message lisible depuis une charge utile d'exception Nest/Zod. */
function pickMessage(res: Record<string, unknown>): { message: string; field: string | null } {
  const raw = res['message'];

  if (Array.isArray(raw)) {
    // Nest ValidationPipe / ZodValidationPipe : [{message, property?}, ...] ou string[]
    const first = raw[0] as unknown;
    if (typeof first === 'string') {
      return { message: raw.join(', '), field: null };
    }
    if (first && typeof first === 'object') {
      const obj = first as { message?: unknown; property?: unknown; path?: unknown };
      const property =
        typeof obj.property === 'string' ? obj.property : typeof obj.path === 'string' ? obj.path : null;
      const text = typeof obj.message === 'string' ? obj.message : 'Données invalides';
      return { message: raw.length > 1 ? `${text} (et ${raw.length - 1} autre(s))` : text, field: property };
    }
    return { message: 'Données invalides', field: null };
  }

  if (typeof raw === 'string') return { message: raw, field: null };

  const field = typeof res['field'] === 'string' ? (res['field'] as string) : null;
  const code = typeof res['code'] === 'string' ? (res['code'] as string) : null;
  const detail = typeof res['detail'] === 'string' ? (res['detail'] as string) : null;
  return { message: detail ?? code ?? 'Une erreur est survenue.', field };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId = request.headers['x-trace-id'] || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: NormalizedError = {
      code: 'INTERNAL_ERROR',
      title: TITLES[500],
      detail: 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.',
      field: null,
      errors: null,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res = exception.getResponse();
      const payload =
        typeof res === 'string' ? { message: res } : res && typeof res === 'object' ? (res as Record<string, unknown>) : {};

      const { message, field } = pickMessage(payload);
      const code =
        typeof payload['code'] === 'string' ? (payload['code'] as string) : DEFAULT_CODES[status] ?? 'ERROR';

      // Les codes 5xx ne doivent jamais refléter un message interne au client.
      const detail = status >= 500 ? TITLES[status] ?? body.detail : message;

      body = {
        code,
        title: typeof payload['title'] === 'string' ? (payload['title'] as string) : TITLES[status] ?? 'Erreur',
        detail,
        field,
        errors: Array.isArray(payload['errors']) ? (payload['errors'] as unknown[]) : null,
      };
    } else {
      // Jamais de fuite d'erreur interne (SQL, stack, mots de passe...)
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json({
      statusCode: status,
      code: body.code,
      title: body.title,
      detail: body.detail,
      field: body.field,
      errors: body.errors,
      traceId,
      timestamp: new Date().toISOString(),
    });
  }
}
