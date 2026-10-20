// src/savings/savings.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sha256 } from '../common/utils/hash';
import { PaginatedDto, paginate, resolvePageParams } from '../common/utils/pagination';
import {
  ListSavingsHistoryQuery,
  ListSavingsQuery,
  MIN_SAVINGS_PAYMENT,
  SavingsPaymentInput,
} from './dto/savings.dto';
import {
  SAVINGS_INCLUDE,
  SavingsDto,
  SavingsPaymentDto,
  addMonths,
  toSavingsDto,
  toSavingsPaymentDto,
} from './savings.mapper';
import { randomUUID } from 'node:crypto';

const START_ENDPOINT = 'POST /savings/start';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Durée par défaut d'une épargne (mois). Fixée au démarrage à partir de
 * l'objectif ; jamais choisie par le client.
 */
const DEFAULT_SAVINGS_MONTHS = 6;

/**
 * Épargne progressive.
 *
 * Modèle imposé par l'architecture : PRODUIT → COMMANDE → FINANCEMENT. Une
 * épargne est donc **toujours** rattachée à une commande existante appartenant
 * au même utilisateur : il n'existe pas d'épargne « libre ».
 *
 * Tous les montants sont en unités mineures (BIGINT) et proviennent de la base.
 * Aucun montant n'est jamais accepté tel quel du client sans vérification.
 */
@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Démarre une épargne sur une commande.
   *
   * `Idempotency-Key` obligatoire : un double clic ne doit pas créer deux
   * épargnes sur la même commande (`AGENTS.md` §14, §28).
   */
  async startSavings(
    userId: string,
    orderId: string,
    idempotencyKey: string,
  ): Promise<SavingsDto> {
    const requestHash = sha256({ orderId, userId });

    const replay = await this.readIdempotent(userId, idempotencyKey, START_ENDPOINT, requestHash);
    if (replay) return replay;

    // La commande doit appartenir à l'utilisateur : un identifiant d'URL ne
    // prouve rien (`AGENTS.md` §50).
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, totalPrice: true, currency: true, financingMode: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');

    if (order.financingMode !== 'SAVINGS') {
      throw new UnprocessableEntityException(
        'Cette commande n’est pas financée par épargne progressive.',
      );
    }

    const existing = await this.prisma.savings.findUnique({ where: { orderId: order.id } });
    if (existing) {
      // Une épargne existe déjà : on renvoie la même chose plutôt que d'en créer
      // une seconde. Le comportement reste idempotent même sans clé rejouée.
      const full = await this.prisma.savings.findUniqueOrThrow({
        where: { id: existing.id },
        include: SAVINGS_INCLUDE,
      });
      return toSavingsDto(full);
    }

    const now = new Date();
    const deadline = addMonths(now, DEFAULT_SAVINGS_MONTHS);
    // Suggestion mensuelle : objectif réparti sur la durée. Le client peut verser
    // librement, ce montant n'est qu'une indication backend.
    const monthlyTarget = order.totalPrice / BigInt(DEFAULT_SAVINGS_MONTHS);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const savings = await tx.savings.create({
          data: {
            orderId: order.id,
            userId,
            targetAmount: order.totalPrice,
            savedAmount: 0n,
            currency: order.currency,
            monthlyTarget,
            status: 'IN_PROGRESS',
            startedAt: now,
            deadline,
          },
          include: SAVINGS_INCLUDE,
        });

        const dto = toSavingsDto(savings);

        await tx.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            endpoint: START_ENDPOINT,
            userId,
            requestHash,
            responseStatus: 201,
            responseBody: dto as unknown as Prisma.InputJsonValue,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        });

        return dto;
      });

      return created;
    } catch (error) {
      // Course entre deux requêtes concurrentes sur la même commande : l'unicité
      // de `orderId` tranche, on renvoie l'épargne réellement créée.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const full = await this.prisma.savings.findUniqueOrThrow({
          where: { orderId: order.id },
          include: SAVINGS_INCLUDE,
        });
        return toSavingsDto(full);
      }
      throw error;
    }
  }

  async listSavings(userId: string, query: ListSavingsQuery): Promise<PaginatedDto<SavingsDto>> {
    const page = resolvePageParams(query);
    const where: Prisma.SavingsWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.savings.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        include: SAVINGS_INCLUDE,
      }),
      this.prisma.savings.count({ where }),
    ]);

    return paginate(rows.map(toSavingsDto), total, page);
  }

  /** Toujours scopé par `userId` : jamais d'accès par identifiant seul. */
  async getSavings(userId: string, savingsId: string): Promise<SavingsDto> {
    const savings = await this.prisma.savings.findFirst({
      where: { id: savingsId, userId },
      include: SAVINGS_INCLUDE,
    });
    if (!savings) throw new NotFoundException('Épargne introuvable.');
    return toSavingsDto(savings);
  }

  async getHistory(
    userId: string,
    savingsId: string,
    query: ListSavingsHistoryQuery,
  ): Promise<PaginatedDto<SavingsPaymentDto>> {
    // Vérifie l'appartenance AVANT de lire l'historique.
    await this.getSavings(userId, savingsId);

    const page = resolvePageParams(query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.savingsPayment.findMany({
        where: { savingsId },
        orderBy: { paidAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.savingsPayment.count({ where: { savingsId } }),
    ]);

    return paginate(rows.map(toSavingsPaymentDto), total, page);
  }

  /**
   * Enregistre un versement d'épargne.
   *
   * Règles métier **validées ici, jamais côté client** (`AGENTS.md` §10, §12) :
   * - montant entier strictement positif ;
   * - minimum 1 000 F CFA ;
   * - plafonné au reste à atteindre (`targetAmount − savedAmount`).
   *
   * Un versement ne peut pas dépasser l'objectif : c'est une contrainte
   * d'intégrité, pas une préférence d'affichage.
   */
  async makePayment(
    userId: string,
    savingsId: string,
    input: SavingsPaymentInput,
    idempotencyKey: string,
  ): Promise<SavingsDto> {
    const endpoint = `POST /savings/${savingsId}/payment`;
    const requestHash = sha256({
      savingsId,
      userId,
      amount: input.amount,
      method: input.method,
    });

    const replay = await this.readIdempotent(userId, idempotencyKey, endpoint, requestHash);
    if (replay) return replay;

    const savings = await this.prisma.savings.findFirst({
      where: { id: savingsId, userId },
      include: SAVINGS_INCLUDE,
    });
    if (!savings) throw new NotFoundException('Épargne introuvable.');

    if (savings.status !== 'IN_PROGRESS' && savings.status !== 'EXTENDED') {
      throw new UnprocessableEntityException(
        'Cette épargne n’accepte plus de versement.',
      );
    }

    const amount = BigInt(input.amount);
    if (amount < BigInt(MIN_SAVINGS_PAYMENT)) {
      throw new UnprocessableEntityException(
        `Le versement minimum est de ${MIN_SAVINGS_PAYMENT} F CFA.`,
      );
    }

    const remaining = savings.targetAmount - savings.savedAmount;
    if (remaining <= 0n) {
      throw new UnprocessableEntityException('Cet objectif est déjà atteint.');
    }
    if (amount > remaining) {
      throw new UnprocessableEntityException(
        'Le versement dépasse le reste à atteindre.',
      );
    }

    const newSaved = savings.savedAmount + amount;
    const reached = newSaved >= savings.targetAmount;

    return this.prisma.$transaction(async (tx) => {
      // Verrou optimiste : deux versements simultanés ne doivent pas se perdre.
      const updated = await tx.savings.updateMany({
        where: { id: savings.id, version: savings.version },
        data: {
          savedAmount: newSaved,
          status: reached ? 'REACHED' : savings.status,
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          'L’épargne a été modifiée entre-temps. Actualisez puis réessayez.',
        );
      }

      await tx.savingsPayment.create({
        data: {
          savingsId: savings.id,
          amount,
          currency: savings.currency,
          method: input.method,
          status: 'CONFIRMED',
          idempotencyKey,
          providerRef: `np-local-${randomUUID()}`,
          paidAt: new Date(),
        },
      });

      const fresh = await tx.savings.findUniqueOrThrow({
        where: { id: savings.id },
        include: SAVINGS_INCLUDE,
      });
      const dto = toSavingsDto(fresh);

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          endpoint,
          userId,
          requestHash,
          responseStatus: 202,
          responseBody: dto as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });

      return dto;
    });
  }

  private async readIdempotent(
    userId: string,
    key: string,
    endpoint: string,
    requestHash: string,
  ): Promise<SavingsDto | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { key_endpoint_userId: { key, endpoint, userId } },
    });
    if (!record) return null;

    if (record.requestHash !== requestHash) {
      throw new ConflictException(
        'Cette clé d’idempotence a déjà été utilisée pour une autre opération.',
      );
    }
    return record.responseBody as unknown as SavingsDto;
  }
}
