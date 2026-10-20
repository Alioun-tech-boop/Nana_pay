// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Argon2Service, CryptoService } from '../common/crypto';
import { LoginDto, LoginDtoSchema } from './dto/login.dto';
import { RegisterDto, RegisterDtoSchema } from './dto/register.dto';
import { ContractUser, toContractUser } from './auth.mapper';
import { z } from 'zod';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly argon2: Argon2Service,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: 'PENDING_VERIFICATION';
  }> {
    const parsed = RegisterDtoSchema.parse(dto);

    if (parsed.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: parsed.email },
        select: { id: true },
      });
      if (existing) throw new ConflictException('Un compte existe deja avec cet email.');
    }
    if (parsed.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: parsed.phone },
        select: { id: true },
      });
      if (existing) throw new ConflictException('Un compte existe deja avec ce numero.');
    }

    const passwordHash = await this.argon2.hash(parsed.password);

    const user = await this.prisma.user.create({
      data: {
        // Inscription par telephone : le compte n'a pas d'email.
        email: parsed.email ?? null,
        passwordHash,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone ?? null,
        roles: ['CLIENT'],
        status: 'PENDING_VERIFICATION',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email ?? '',
      phone: user.phone ?? '',
      status: 'PENDING_VERIFICATION',
    };
  }

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: ContractUser }> {
    const parsed = LoginDtoSchema.parse(dto);

    // Contrat API-CONTRACT.md §3 : `identifier` = email OU numero de telephone.
    const identifier = (parsed.identifier ?? parsed.email ?? '').trim();
    const phoneCandidate = identifier.replace(/[\s().-]/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }, { phone: phoneCandidate }],
      },
    });

    // Constant-time-ish: always run verify even if user not found (prevent user enumeration)
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordValid = user
      ? await this.argon2.verify(user.passwordHash, parsed.password)
      : await this.argon2.verify(dummyHash, parsed.password);

    if (!user || !passwordValid) {
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: { increment: 1 } },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new UnauthorizedException('Account suspended');
    }

    // MFA : aucun flux MFA n'est expose au client pour l'instant. On refuse
    // explicitement plutot que de renvoyer une session incomplète.
    if (user.mfaEnabled && !parsed.mfaCode) {
      throw new UnauthorizedException('Code de verification a 6 chiffres requis.');
    }

    // Reset failed login count
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    const tokens = await this.issueTokens(user.id, user.roles, 'login', ip, userAgent);

    // Contrat : `{ accessToken, refreshToken, user }` (pas d'enveloppe `tokens`).
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this.loadContractUser(user.id),
    };
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, {
        publicKey: this.config.get<string>('JWT_PUBLIC_KEY'),
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenJti: payload.jti },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // Reuse detection: if token was already revoked, revoke all sessions (potential theft)
      if (session?.revokedAt) {
        await this.prisma.session.updateMany({
          where: { userId: payload.sub },
          data: { revokedAt: new Date(), revokedReason: 'reuse_detected' },
        });
      }
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Device fingerprint check (optional strict mode)
    // Rotate: revoke old, issue new
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokedReason: 'rotated', replacedByJti: payload.jti },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User inactive');
    }

    return this.issueTokens(user.id, user.roles, 'refresh', ip, userAgent, session.id);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verify(refreshToken, {
        publicKey: this.config.get<string>('JWT_PUBLIC_KEY'),
        algorithms: ['RS256'],
      });
      if (payload.jti) {
        await this.prisma.session.updateMany({
          where: { refreshTokenJti: payload.jti },
          data: { revokedAt: new Date(), revokedReason: 'logout' },
        });
      }
    } catch {
      // Ignore invalid token on logout
    }
  }

  /** Contrat API-CONTRACT.md §3 : `GET /auth/me` -> `{ user }`. */
  async me(userId: string): Promise<{ user: ContractUser }> {
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    return { user: await this.loadContractUser(userId) };
  }

  /**
   * Contrat utilisateur (API-CONTRACT.md §3.1) : profil minimal, aucun champ
   * financier. `permissions` est evalue par le backend (l'UI ne fait que masquer).
   */
  private async loadContractUser(userId: string): Promise<ContractUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        merchant: { select: { id: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return toContractUser(user);
  }

  private async issueTokens(
    userId: string,
    roles: string[],
    type: 'login' | 'register' | 'refresh',
    ip?: string,
    userAgent?: string,
    previousSessionId?: string,
  ): Promise<TokenPair> {
    const jti = this.crypto.randomToken(16);
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '7d');

    const accessToken = this.jwt.sign(
      { sub: userId, roles, type: 'access' },
      {
        privateKey: this.config.get<string>('JWT_PRIVATE_KEY'),
        algorithm: 'RS256',
        expiresIn: this.parseTtl(accessTtl) / 1000,
        issuer: 'nana-pay',
        audience: 'nana-pay-api',
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, roles, type: 'refresh', jti },
      {
        privateKey: this.config.get<string>('JWT_PRIVATE_KEY'),
        algorithm: 'RS256',
        expiresIn: this.parseTtl(refreshTtl) / 1000,
        issuer: 'nana-pay',
        audience: 'nana-pay-api',
      },
    );

    const expiresAt = new Date(Date.now() + this.parseTtl(refreshTtl));

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.crypto.sha256(refreshToken),
        refreshTokenJti: jti,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    // Parse TTL to seconds
    const accessExpiresIn = this.parseTtl(accessTtl) / 1000;

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  private parseTtl(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // 15 min default
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] || 60000);
  }
}
