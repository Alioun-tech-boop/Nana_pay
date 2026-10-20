// src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // `getAllAndOverride` : le décorateur @Public() est accepté sur la méthode
    // ET sur le contrôleur (ex. Catalog, entièrement public).
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentification requise.');
    }

    const token = authHeader.substring(7);
    try {
      const payload = this.jwt.verify(token, {
        publicKey: this.config.get<string>('JWT_PUBLIC_KEY'),
        algorithms: ['RS256'],
        issuer: 'nana-pay',
        audience: 'nana-pay-api',
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Authentification requise.');
      }

      request.user = { id: payload.sub, roles: payload.roles };
      return true;
    } catch {
      throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    }
  }
}
