// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();
    const traceId = request.headers['x-trace-id'] || uuidv4();
    request.headers['x-trace-id'] = traceId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          traceId,
          method: request.method,
          path: request.url,
          status: response.statusCode,
          durationMs: duration,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          userId: request.user?.id,
        }));
      }),
    );
  }
}
