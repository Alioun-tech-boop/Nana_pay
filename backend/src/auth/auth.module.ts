// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { Argon2Service, CryptoService } from '../common/crypto';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        publicKey: config.get<string>('JWT_PUBLIC_KEY'),
        privateKey: config.get<string>('JWT_PRIVATE_KEY'),
        signOptions: { algorithm: 'RS256', issuer: 'nana-pay', audience: 'nana-pay-api' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, Argon2Service, CryptoService],
  exports: [AuthService, Argon2Service, CryptoService],
})
export class AuthModule {}
