// src/vault/vault.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sha256 } from '../common/utils/hash';
import { PaginatedDto, paginate, resolvePageParams } from '../common/utils/pagination';
import {
  ConfigureVaultPlanInput,
  ListVaultTransactionsQuery,
  UseVaultInput,
} from './dto/vault.dto';
import {
  VAULT_DEFAULT_CURRENCY,
  VAULT_INCLUDE,
  VaultDto,
  VaultTransactionDto,
  toVaultDto,
  toVaultDtoFromCreation,
  toVaultTransactionDto,
} from './vault.mapper';

const PLAN_ENDPOINT = 'PUT /vault/plan';
const USE_ENDPOINT = 'POST /vault/use';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Coffre NanaPay.
 *
 * Deux règles de fond, et elles structurent tout le module :
 *
 * 1. **Le coffre n'est pas un portefeuille générique.** Il est réservé aux
 *    salariés éligibles, dont le profil bancaire a été validé. L'éligibilité est
 *    relue en base à chaque opération et n'est jamais un paramètre d'entrée
 *    (`API-CONTRACT.md` §6.2).
 * 2. **Le coffre est alimenté uniquement par prélèvement mensuel sur salaire.**
 *    Il n'existe volontairement **aucun** endpoint de rechargement manuel : le
 *    client définit un plan, le backend l'exécute. Ajouter un versement manuel
 *    ici transformerait le coffre en portefeuille et viderait la règle de sens.
 *
 * Tous les montants sont en unités mineures (BIGINT) et proviennent de la base.
 */
@Injectable()
export class VaultService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Coffre de l'utilisateur courant.
   *
   * Le coffre est créé à la première consultation s'il n'existe pas encore :
   * c'est une fiche vide (solde 0, plan non défini), pas une ressource
   * financière. Cela évite au client un écran « introuvable » alors que son
   * éligibilité, elle, est bien réelle.
   */
  async getVault(userId: string): Promise<VaultDto> {
    const existing = await this.prisma.vault.findUnique({
      where: { userId },
      include: VAULT_INCLUDE,
    });
    if (existing) return toVaultDto(existing);

    const created = await this.prisma.vault.create({
      data: { userId, balance: 0n },
    });
    return toVaultDtoFromCreation(created, 0);
  }

  /** Mouvements du coffre, du plus récent au plus ancien. Scopé par utilisateur. */
  async listTransactions(
    userId: string,
    query: ListVaultTransactionsQuery,
  ): Promise<PaginatedDto<VaultTransactionDto>> {
    // L'appartenance est vérifiée avant toute lecture : un identifiant d'URL ne
    // prouve rien (`AGENTS.md` §50).
    const vault = await this.requireVault(userId);
    const page = resolvePageParams(query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vaultTransaction.findMany({
        where: { vaultId: vault.id },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.vaultTransaction.count({ where: { vaultId: vault.id } }),
    ]);

    return paginate(rows.map(toVaultTransactionDto), total, page);
  }

  /**
   * Définit ou modifie le plan du coffre.
   *
   * Le client choisit les deux montants ; le backend valide et **confirme les
   * termes définitifs**. Chaque version du plan est conservée dans
   * `VaultPlanHistory` : un plan financier doit rester auditable, y compris
   * lorsqu'il est remplacé.
   */
  async configurePlan(
    userId: string,
    input: ConfigureVaultPlanInput,
    idempotencyKey: string,
  ): Promise<VaultDto> {
    const requestHash = sha256({
      userId,
      monthlyAmount: input.monthlyAmount,
      targetAmount: input.targetAmount,
    });

    const replay = await this.readIdempotent(userId, idempotencyKey, PLAN_ENDPOINT, requestHash);
    if (replay) return replay;

    const vault = await this.requireVault(userId);
    this.assertEligible(vault);

    if (BigInt(input.monthlyAmount) > BigInt(input.targetAmount)) {
      throw new UnprocessableEntityException(
        'Le prélèvement mensuel ne peut pas dépasser la somme visée.',
      );
    }

    const currency = await this.resolveCurrency(vault.id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vault.update({
        where: { id: vault.id },
        data: {
          monthlyContribution: BigInt(input.monthlyAmount),
          targetAmount: BigInt(input.targetAmount),
        },
      });

      // Trace du terme précédent : sans elle, un client ne pourrait pas savoir
      // ce qui a été réellement convenu avant la modification.
      await tx.vaultPlanHistory.create({
        data: {
          vaultId: vault.id,
          monthlyAmount: BigInt(input.monthlyAmount),
          targetAmount: BigInt(input.targetAmount),
          idempotencyKey,
          configuredBy: userId,
        },
      });

      const fresh = await tx.vault.findUniqueOrThrow({
        where: { id: vault.id },
        include: VAULT_INCLUDE,
      });
      const dto = toVaultDto(fresh, currency);

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          endpoint: PLAN_ENDPOINT,
          userId,
          requestHash,
          responseStatus: 200,
          responseBody: dto as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });

      return dto;
    });
  }

  /**
   * Affecte le solde du coffre au financement d'une commande.
   *
   * Séquence non négociable : le coffre ne paie **pas** le commerçant, il
   * finance une commande. Le retrait et le règlement restent des étapes
   * ultérieures, décidées par le backend (`AGENTS.md` §16).
   */
  async useVault(
    userId: string,
    input: UseVaultInput,
    idempotencyKey: string,
  ): Promise<VaultDto> {
    const requestHash = sha256({ userId, orderId: input.orderId });

    const replay = await this.readIdempotent(userId, idempotencyKey, USE_ENDPOINT, requestHash);
    if (replay) return replay;

    const vault = await this.requireVault(userId);
    this.assertEligible(vault);

    if (vault.targetAmount === null || vault.monthlyContribution === null) {
      throw new UnprocessableEntityException(
        'Définissez d’abord votre plan coffre avant de financer une commande.',
      );
    }

    // La commande doit appartenir à l'utilisateur.
    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, userId },
      select: {
        id: true,
        reference: true,
        totalPrice: true,
        currency: true,
        financingMode: true,
        vaultUsage: { select: { id: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');

    if (order.financingMode !== 'VAULT') {
      throw new UnprocessableEntityException(
        'Cette commande n’est pas financée par le coffre NanaPay.',
      );
    }

    // Une commande ne se finance qu'une fois. On renvoie l'état courant plutôt
    // que de débiter une seconde fois : l'opération reste idempotente même sans
    // clé rejouée.
    if (order.vaultUsage) {
      const fresh = await this.prisma.vault.findUniqueOrThrow({
        where: { id: vault.id },
        include: VAULT_INCLUDE,
      });
      return toVaultDto(fresh, order.currency);
    }

    const amount = order.totalPrice;
    if (amount <= 0n) {
      throw new UnprocessableEntityException('Le montant de la commande est invalide.');
    }

    if (vault.balance < amount) {
      throw new UnprocessableEntityException(
        'Le solde du coffre est insuffisant pour financer cette commande.',
      );
    }

    const currency = await this.resolveCurrency(vault.id);
    const newBalance = vault.balance - amount;

    return this.prisma.$transaction(async (tx) => {
      // Verrou optimiste sur `updatedAt` : deux financements simultanés ne
      // doivent pas se perdre. Le perdant reçoit 409 et relit l'état réel.
      const debited = await tx.vault.updateMany({
        where: { id: vault.id, updatedAt: vault.updatedAt },
        data: { balance: newBalance },
      });
      if (debited.count === 0) {
        throw new ConflictException(
          'Le coffre a été modifié entre-temps. Actualisez puis réessayez.',
        );
      }

      await tx.vaultUsage.create({
        data: {
          vaultId: vault.id,
          orderId: order.id,
          amount,
          idempotencyKey,
        },
      });

      await tx.vaultTransaction.create({
        data: {
          vaultId: vault.id,
          type: 'DEBIT',
          amount,
          currency,
          balanceAfter: newBalance,
          reference: order.reference,
          description: `Financement de la commande ${order.reference}`,
        },
      });

      const fresh = await tx.vault.findUniqueOrThrow({
        where: { id: vault.id },
        include: VAULT_INCLUDE,
      });
      const dto = toVaultDto(fresh, currency);

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          endpoint: USE_ENDPOINT,
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

  /**
   * Coffre existant, ou créé à la volée.
   *
   * Ne vérifie **pas** l'éligibilité : la consultation d'un coffre vide reste
   * légitime, c'est même ainsi que le client découvre son statut.
   */
  private async requireVault(userId: string) {
    const existing = await this.prisma.vault.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.vault.create({ data: { userId, balance: 0n } });
  }

  /**
   * Refuse toute opération de coffre à un client non éligible.
   *
   * `Vault.eligible` est positionné par le flux bancaire (validation du profil
   * par l'employeur/banque), pas par ce module et jamais par le frontend.
   * Le coffre se contente de relire cette décision (`AGENTS.md` §9, §19).
   */
  private assertEligible(vault: { eligible: boolean }): void {
    if (!vault.eligible) {
      throw new ForbiddenException(
        'Votre profil bancaire n’a pas encore été validé : le coffre NanaPay n’est pas encore disponible.',
      );
    }
  }

  /**
   * Devise des mouvements du coffre.
   *
   * `Vault` ne porte pas de devise : on prend celle du dernier mouvement, à
   * défaut la devise de référence. Écrire en dur `XOF` partout risquerait de
   * contredire un mouvement réel libellé autrement.
   */
  private async resolveCurrency(vaultId: string): Promise<string> {
    const last = await this.prisma.vaultTransaction.findFirst({
      where: { vaultId },
      orderBy: { createdAt: 'desc' },
      select: { currency: true },
    });
    return last?.currency ?? VAULT_DEFAULT_CURRENCY;
  }

  private async readIdempotent(
    userId: string,
    key: string,
    endpoint: string,
    requestHash: string,
  ): Promise<VaultDto | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { key_endpoint_userId: { key, endpoint, userId } },
    });
    if (!record) return null;

    if (record.requestHash !== requestHash) {
      throw new ConflictException(
        'Cette clé d’idempotence a déjà été utilisée pour une autre opération.',
      );
    }
    return record.responseBody as unknown as VaultDto;
  }
}
