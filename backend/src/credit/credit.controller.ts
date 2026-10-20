// src/credit/credit.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import {
  ListCreditRequestsQuery,
  RequestCreditInput,
  listCreditRequestsQuerySchema,
  requestCreditSchema,
} from './dto/credit.dto';
import {
  CreditDto,
  CreditProfileDto,
  CreditRequestDto,
  EligibilityDto,
} from './credit.mapper';
import { PaginatedDto } from '../common/utils/pagination';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { requireIdempotencyKey } from '../common/utils/idempotency';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * Crédit bancaire — espace client.
 *
 * Toutes les routes sont authentifiées et scopées à l'utilisateur courant :
 * `userId` vient du jeton, jamais de la requête (`AGENTS.md` §19, §50).
 *
 * Aucune route de décision n'existe ici. Accepter ou refuser une demande est un
 * acte de la **banque** : il appartient à l'espace `/bank` (`AGENTS.md` §45).
 * Exposer une route de décision côté client serait une faille d'autorisation.
 */
@Controller('credit')
export class CreditController {
  constructor(private readonly credit: CreditService) {}

  /** Éligibilité du client courant, relue en base. */
  @Get('eligibility')
  getEligibility(@CurrentUser() user: AuthenticatedUser): Promise<EligibilityDto> {
    return this.credit.getEligibility(user.id);
  }

  /** Dossier bancaire du client courant ; `null` s'il n'existe pas encore. */
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<CreditProfileDto | null> {
    return this.credit.getProfile(user.id);
  }

  /** Crédit décaissé du client courant ; `null` s'il n'y en a pas. */
  @Get()
  getCredit(@CurrentUser() user: AuthenticatedUser): Promise<CreditDto | null> {
    return this.credit.getCredit(user.id);
  }

  @Get('requests')
  listRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listCreditRequestsQuerySchema))
    query: ListCreditRequestsQuery,
  ): Promise<PaginatedDto<CreditRequestDto>> {
    return this.credit.listRequests(user.id, query);
  }

  @Get('requests/:id')
  getRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CreditRequestDto> {
    return this.credit.getRequest(user.id, id);
  }

  /**
   * Dépôt d'une demande de crédit.
   *
   * `Idempotency-Key` obligatoire : une demande de financement ne doit jamais
   * être dupliquée par un double clic (`AGENTS.md` §14, §28).
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestCredit(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(requestCreditSchema)) body: RequestCreditInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CreditRequestDto> {
    return this.credit.requestCredit(user.id, body, requireIdempotencyKey(idempotencyKey));
  }
}
