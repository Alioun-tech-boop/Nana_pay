// src/orders/orders.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sha256 } from '../common/utils/hash';
import { buildOrderReference, startOfNextYear, startOfYear } from '../common/utils/reference';
import { PaginatedDto, paginate, resolvePageParams } from '../common/utils/pagination';
import { CreateOrderInput, ListOrdersQuery, OrderStatus } from './dto/orders.dto';
import {
  ORDER_INCLUDE,
  OrderDto,
  toOrderDto,
} from './orders.mapper';

const CREATE_ENDPOINT = 'POST /orders';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CREATE_ATTEMPTS = 3;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une commande. Le total est calculé côté backend (prix unitaire
   * serveur × quantité) : le frontend ne fournit jamais un montant.
   * Idempotence : la même `Idempotency-Key` renvoie la même commande.
   */
  async createOrder(
    userId: string,
    input: CreateOrderInput,
    idempotencyKey: string,
  ): Promise<OrderDto> {
    const endpoint = CREATE_ENDPOINT;
    const requestHash = sha256({ productId: input.productId, financingMode: input.financingMode, quantity: input.quantity, userId });

    const replay = await this.readIdempotent(userId, idempotencyKey, endpoint, requestHash);
    if (replay) return replay;

    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, isActive: true, merchant: { status: 'VALIDATED' } },
    });
    if (!product) throw new NotFoundException('Produit indisponible.');

    if (product.stock < input.quantity) {
      throw new UnprocessableEntityException(`Stock insuffisant pour « ${product.name} ».`);
    }

    const quantity = input.quantity;
    // Prix serveur, unités mineures. Jamais de calcul monétaire côté client.
    const totalPrice = product.price * BigInt(quantity);

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt++) {
      try {
        return await this.runCreateAttempt(
          userId,
          idempotencyKey,
          endpoint,
          requestHash,
          product,
          quantity,
          totalPrice,
          input.financingMode,
        );
      } catch (error) {
        lastError = error;
        // Collision sur l'unicité de la référence : on retente avec la suivante.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new ConflictException("Impossible d'attribuer un identifiant de commande. Réessayez.");
  }

  private async runCreateAttempt(
    userId: string,
    idempotencyKey: string,
    endpoint: string,
    requestHash: string,
    product: { id: string; merchantId: string; name: string; currency: string },
    quantity: number,
    totalPrice: bigint,
    financingMode: CreateOrderInput['financingMode'],
  ): Promise<OrderDto> {
    return this.prisma.$transaction(async (tx) => {
      // Réservation atomique du stock (optimistic) : jamais de stock négatif.
      const reserved = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (reserved.count === 0) {
        throw new UnprocessableEntityException(`Stock insuffisant pour « ${product.name} ».`);
      }

      const order = await tx.order.create({
        data: {
          reference: await this.nextReference(tx),
          userId,
          merchantId: product.merchantId,
          productId: product.id,
          quantity,
          status: 'ORDER_CREATED',
          financingMode,
          totalPrice,
          currency: product.currency,
        },
        include: ORDER_INCLUDE,
      });

      const dto = toOrderDto(order);

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          endpoint,
          userId,
          requestHash,
          responseStatus: 201,
          responseBody: dto as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });

      return dto;
    });
  }

  private async nextReference(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getUTCFullYear();
    const count = await tx.order.count({
      where: { createdAt: { gte: startOfYear(year), lt: startOfNextYear(year) } },
    });
    return buildOrderReference(year, count + 1);
  }

  private async readIdempotent(
    userId: string,
    key: string,
    endpoint: string,
    requestHash: string,
  ): Promise<OrderDto | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { key_endpoint_userId: { key, endpoint, userId } },
    });
    if (!record) return null;

    if (record.requestHash !== requestHash) {
      throw new ConflictException(
        "Cette clé d'idempotence a déjà été utilisée pour une autre opération.",
      );
    }
    return record.responseBody as unknown as OrderDto;
  }

  async listOrders(userId: string, query: ListOrdersQuery): Promise<PaginatedDto<OrderDto>> {
    const page = resolvePageParams(query);
    const where: Prisma.OrderWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(rows.map(toOrderDto), total, page);
  }

  /** Toujours scopé par `userId` : un identifiant dans l'URL ne prouve rien. */
  async getOrder(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return toOrderDto(order);
  }

  async getOrderStatus(userId: string, orderId: string): Promise<{ status: OrderStatus; at: string }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { status: true, updatedAt: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return { status: order.status, at: order.updatedAt.toISOString() };
  }
}
