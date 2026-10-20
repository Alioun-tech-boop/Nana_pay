// src/credit/credit.service.ts
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
import { ListCreditRequestsQuery, RequestCreditInput } from './dto/credit.dto';
import {
  CREDIT_REQUEST_INCLUDE,
  CreditDto,
  CreditProfileDto,
  CreditRequestDto,
  EligibilityDto,
  toCreditDto,
  toCreditProfileDto,
  toCreditRequestDto,
  toDbStatuses,
  toEligibilityDto,
  bpsToPercent,
} from './credit.mapper';
import {
  CreditConfig,
  DEFAULT_CREDIT_CONFIG,
  computeTotalRepayment,
  interestRateBpsForTerm,
} from './credit.config';

const REQUEST_ENDPOINT = 'POST /credit/request';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const CURRENCY = 'XOF';

/**
 * Crédit bancaire — espace client.
 *
 * Trois notions restent **strictement distinctes** (`AGENTS.md` §9, §57) :
 *
 * - `CreditProfile` : le dossier du client, **validé par la banque**. Le client
 *   ne l'écrit jamais ; il peut seulement le consulter.
 * - `CreditRequest` : la demande de financement d'**une** commande. C'est la
 *   seule chose que ce service crée.
 * - `Credit` : le crédit décaissé, qui porte le remboursement. Il naît de la
 *   décision de la banque, jamais du client.
 *
 * Ce module ne fait donc **aucune décision d'octroi** : il enregistre une
 * demande et la place dans la file d'analyse. Le backend (banque) décide, et
 * c'est lui qui créera le `Credit` (`AGENTS.md` §1, §45).
 *
 * Aucun montant n'est calculé à partir d'une entrée libre : le montant demandé
 * est celui de la commande, relu en base. Le taux et le total à rembourser sont
 * calculés par le serveur à partir d'un barème configurable
 * (`credit.config.ts`) — jamais envoyés par le client.
 */
@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Éligibilité du client courant.
   *
   * Elle est **relue en base** à chaque appel. Le frontend affiche la réponse ;
   * il ne décide ni ne devine (`AGENTS.md` §10, §19).
   *
   * Un client sans dossier n'est pas éligible — mais ce n'est pas une erreur :
   * c'est l'état normal d'un compte qui n'a pas encore été présenté à la
   * banque, et l'interface doit pouvoir l'expliquer.
   */
  async getEligibility(
    userId: string,
    config: CreditConfig = DEFAULT_CREDIT_CONFIG,
  ): Promise<EligibilityDto> {
    const profile = await this.prisma.creditProfile.findUnique({ where: { userId } });

    if (!profile) {
      return toEligibilityDto(false, [
        'Votre dossier bancaire n’a pas encore été ouvert par la banque.',
      ]);
    }

    const reasons: string[] = [];

    if (config.eligibility.requiresValidatedProfile) {
      const validated = profile.status === 'VALIDATED' && profile.validatedAt !== null;
      if (!validated) {
        reasons.push('Votre profil bancaire est encore en cours de validation.');
      }
    }

    if (config.eligibility.minScore !== null) {
      if (profile.score === null) {
        reasons.push('Votre score bancaire n’a pas encore été calculé.');
      } else if (profile.score < config.eligibility.minScore) {
        reasons.push('Votre score bancaire est insuffisant pour un crédit.');
      }
    }

    // `requiresVerifiedSalary` / `minMonthlySalary` ne sont évalués que si la
    // donnée existe réellement : un contrôle sur un champ absent rendrait tout
    // le monde inéligible silencieusement (voir `credit.config.ts`).
    if (config.eligibility.requiresVerifiedSalary || config.eligibility.minMonthlySalary !== null) {
      reasons.push(
        'Le contrôle du salaire nécessite une information non disponible dans votre dossier.',
      );
    }

    return toEligibilityDto(reasons.length === 0, reasons);
  }

  /**
   * Dossier bancaire du client courant.
   *
   * Renvoie `null` plutôt qu'un 404 : « pas encore de dossier » est un état
   * légitime de l'espace client, pas une ressource manquante.
   */
  async getProfile(userId: string): Promise<CreditProfileDto | null> {
    const profile = await this.prisma.creditProfile.findUnique({ where: { userId } });
    return profile ? toCreditProfileDto(profile) : null;
  }

  /**
   * Dépose une demande de crédit pour une commande.
   *
   * Règles serveur, dans l'ordre :
   * 1. Le client doit être éligible (profil validé).
   * 2. La commande doit lui appartenir — un identifiant d'URL ne prouve rien
   *    (`AGENTS.md` §50).
   * 3. La commande doit être destinée au crédit bancaire.
   * 4. Une commande ne se finance qu'une fois : `CreditRequest.orderId` est
   *    unique, et une demande existante est renvoyée telle quelle.
   * 5. Le montant est celui de la commande, lu en base ; la durée est validée.
   *
   * `Idempotency-Key` obligatoire : un double clic ne doit pas créer deux
   * demandes (`AGENTS.md` §14, §28).
   */
  async requestCredit(
    userId: string,
    input: RequestCreditInput,
    idempotencyKey: string,
  ): Promise<CreditRequestDto> {
    const requestHash = sha256({
      userId,
      orderId: input.orderId,
      termMonths: input.termMonths,
    });

    const replay = await this.readIdempotent(userId, idempotencyKey, requestHash);
    if (replay) return replay;

    const eligibility = await this.getEligibility(userId);
    if (!eligibility.eligible) {
      throw new ForbiddenException({
        message: 'Vous n’êtes pas éligible à un crédit bancaire pour le moment.',
        reasons: eligibility.reasons,
      });
    }

    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, userId },
      select: {
        id: true,
        reference: true,
        totalPrice: true,
        currency: true,
        financingMode: true,
        creditRequest: { select: { id: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');

    if (order.financingMode !== 'CREDIT') {
      throw new UnprocessableEntityException(
        'Cette commande n’est pas destinée à un financement par crédit bancaire.',
      );
    }

    const rateBps = interestRateBpsForTerm(input.termMonths);
    const totalRepayment = computeTotalRepayment(order.totalPrice, input.termMonths, rateBps);

    // Une commande ne donne lieu qu'à une demande. On renvoie l'existante plutôt
    // que d'en créer une seconde : la réponse reste idempotente même sans clé
    // rejouée, et le client voit l'état réel.
    if (order.creditRequest) {
      const existing = await this.prisma.creditRequest.findUniqueOrThrow({
        where: { id: order.creditRequest.id },
        include: CREDIT_REQUEST_INCLUDE,
      });
      return toCreditRequestDto(existing, rateBps, totalRepayment);
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.creditRequest.create({
        data: {
          userId,
          orderId: order.id,
          amount: order.totalPrice,
          currency: order.currency,
          termMonths: input.termMonths,
          status: 'REQUESTED',
          idempotencyKey,
        },
        include: CREDIT_REQUEST_INCLUDE,
      });

      const dto = toCreditRequestDto(created, rateBps, totalRepayment);

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          endpoint: REQUEST_ENDPOINT,
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
   * Demandes de crédit du client courant, les plus récentes d'abord.
   *
   * Le filtre de statut parle le vocabulaire du contrat ; la traduction vers
   * les statuts de la base est faite par le mapper, en un seul endroit.
   */
  async listRequests(
    userId: string,
    query: ListCreditRequestsQuery,
  ): Promise<PaginatedDto<CreditRequestDto>> {
    const page = resolvePageParams(query);

    const where: Prisma.CreditRequestWhereInput = {
      userId,
      ...(query.status ? { status: { in: toDbStatuses(query.status) as never } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.creditRequest.findMany({
        where,
        include: CREDIT_REQUEST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.creditRequest.count({ where }),
    ]);

    return paginate(
      rows.map((row) => {
        const rateBps = interestRateBpsForTerm(row.termMonths);
        return toCreditRequestDto(
          row,
          rateBps,
          computeTotalRepayment(row.amount, row.termMonths, rateBps),
        );
      }),
      total,
      page,
    );
  }

  /**
   * Détail d'une demande, scopé au client courant.
   *
   * Un client tiers reçoit 404, pas 403 : révéler « cette demande existe mais
   * n'est pas la vôtre » est déjà une fuite d'information (`AGENTS.md` §29).
   */
  async getRequest(userId: string, requestId: string): Promise<CreditRequestDto> {
    const request = await this.prisma.creditRequest.findFirst({
      where: { id: requestId, userId },
      include: CREDIT_REQUEST_INCLUDE,
    });
    if (!request) throw new NotFoundException('Demande de crédit introuvable.');

    const rateBps = interestRateBpsForTerm(request.termMonths);
    return toCreditRequestDto(
      request,
      rateBps,
      computeTotalRepayment(request.amount, request.termMonths, rateBps),
    );
  }

  /**
   * Crédit décaissé du client courant, s'il existe.
   *
   * `remaining` est calculé à partir des remboursements **réellement
   * enregistrés** en base, jamais d'un échéancier théorique (`AGENTS.md` §10).
   */
  async getCredit(userId: string): Promise<CreditDto | null> {
    const credit = await this.prisma.credit.findFirst({
      where: { request: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { repayments: { select: { amount: true } } },
    });
    if (!credit) return null;

    const repaid = credit.repayments.reduce((sum, r) => sum + r.amount, 0n);
    return toCreditDto(credit, repaid);
  }

  private async readIdempotent(
    userId: string,
    key: string,
    requestHash: string,
  ): Promise<CreditRequestDto | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { key_endpoint_userId: { key, endpoint: REQUEST_ENDPOINT, userId } },
    });
    if (!record) return null;

    if (record.requestHash !== requestHash) {
      throw new ConflictException(
        'Cette clé d’idempotence a déjà été utilisée pour une autre opération.',
      );
    }
    return record.responseBody as unknown as CreditRequestDto;
  }
}

/** Réexporté pour les tests : le barème est une donnée métier, pas un détail. */
export { bpsToPercent, CURRENCY };
