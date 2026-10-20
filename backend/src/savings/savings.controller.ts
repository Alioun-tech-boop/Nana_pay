// src/savings/savings.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import {
  ListSavingsHistoryQuery,
  ListSavingsQuery,
  SavingsPaymentInput,
  StartSavingsInput,
  listSavingsHistoryQuerySchema,
  listSavingsQuerySchema,
  savingsPaymentSchema,
  startSavingsSchema,
} from './dto/savings.dto';
import { SavingsDto, SavingsPaymentDto } from './savings.mapper';
import { PaginatedDto } from '../common/utils/pagination';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { requireIdempotencyKey } from '../common/utils/idempotency';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * Épargne progressive.
 *
 * Toutes les routes sont authentifiées et scopées à l'utilisateur courant :
 * `userId` vient du jeton, jamais de la requête.
 */
@Controller('savings')
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  startSavings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(startSavingsSchema)) body: StartSavingsInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<SavingsDto> {
    return this.savings.startSavings(user.id, body.orderId, requireIdempotencyKey(idempotencyKey));
  }

  @Get()
  listSavings(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listSavingsQuerySchema)) query: ListSavingsQuery,
  ): Promise<PaginatedDto<SavingsDto>> {
    return this.savings.listSavings(user.id, query);
  }

  @Get(':id/history')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query(new ZodValidationPipe(listSavingsHistoryQuerySchema)) query: ListSavingsHistoryQuery,
  ): Promise<PaginatedDto<SavingsPaymentDto>> {
    return this.savings.getHistory(user.id, id, query);
  }

  @Get(':id')
  getSavings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SavingsDto> {
    return this.savings.getSavings(user.id, id);
  }

  /**
   * Versement d'épargne.
   *
   * Le statut est confirmé immédiatement ici (pas de passerelle externe côté
   * épargne) : le contrat prévoit un `202` et une vérification via
   * `GET /savings/:id`, ce que le frontend fait déjà.
   */
  @Post(':id/payment')
  @HttpCode(HttpStatus.ACCEPTED)
  makePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(savingsPaymentSchema)) body: SavingsPaymentInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<SavingsDto> {
    return this.savings.makePayment(user.id, id, body, requireIdempotencyKey(idempotencyKey));
  }
}
