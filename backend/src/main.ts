// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // Security headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // CORS strict
  const config = app.get(ConfigService);
  const origins = config.get<string>('CORS_ORIGINS', '').split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      // En-tete reellement envoye par le frontend (voir src/api/client.ts)
      'Idempotency-Key',
      'X-Idempotency-Key',
      'X-Trace-Id',
    ],
    exposedHeaders: ['X-Trace-Id'],
    maxAge: 86400,
  });

  // Préfixe global /api (le healthcheck Render reste sur /healthz)
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'), {
    exclude: ['healthz'],
  });

  // Global filters, interceptors.
  // Pas de ValidationPipe global : il exigerait class-validator, qui n'est pas
  // utilise (tous les DTO sont des schémas Zod validés par ZodValidationPipe).
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Trust proxy (behind reverse proxy)
  const server = app.getHttpServer();
  server.set('trust proxy', 1);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`NanaPay Backend running on port ${port} (${config.get('NODE_ENV')})`);
}

bootstrap();
