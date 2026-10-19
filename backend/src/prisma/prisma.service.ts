// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma réel connecté à PostgreSQL (Supabase).
 *
 * - DATABASE_URL pointe vers le pooler "transaction" (port 6543) pour l'application.
 * - DIRECT_DATABASE_URL pointe vers le pooler "session" (port 5432) pour les migrations.
 *
 * La connexion est ouverte au démarrage du module et fermée proprement à l'arrêt.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connecté à PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
