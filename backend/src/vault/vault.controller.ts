// src/vault/vault.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VaultService } from './vault.service';
import {
  ConfigureVaultPlanInput,
  ListVaultTransactionsQuery,
  UseVaultInput,
  configureVaultPlanSchema,
  listVaultTransactionsQuerySchema,
  useVaultSchema,
} from './dto/vault.dto';
import { VaultDto, VaultTransactionDto } from './vault.mapper';
import { PaginatedDto } from '../common/utils/pagination';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { requireIdempotencyKey } from '../common/utils/idempotency';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * Coffre NanaPay.
 *
 * Toutes les routes sont authentifiées et scopées à l'utilisateur courant :
 * `userId` vient du jeton, jamais de la requête (`AGENTS.md` §19, §50).
 *
 * Il n'existe volontairement **aucun** endpoint d'alimentation manuelle : le
 * coffre est alimenté par prélèvement mensuel sur salaire (`API-CONTRACT.md`
 * §6.2). Ne pas en ajouter sans modifier le contrat.
 */
@Controller('vault')
export class VaultController {
  constructor(private readonly vault: VaultService) {}

  @Get()
  getVault(@CurrentUser() user: AuthenticatedUser): Promise<VaultDto> {
    return this.vault.getVault(user.id);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listVaultTransactionsQuerySchema))
    query: ListVaultTransactionsQuery,
  ): Promise<PaginatedDto<VaultTransactionDto>> {
    return this.vault.listTransactions(user.id, query);
  }

  /**
   * Définition du plan coffre.
   *
   * `PUT` : le plan est une ressource unique qui se remplace, pas une
   * historique de créations. Chaque version reste tracée côté backend.
   */
  @Put('plan')
  @HttpCode(HttpStatus.OK)
  configurePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(configureVaultPlanSchema)) body: ConfigureVaultPlanInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<VaultDto> {
    return this.vault.configurePlan(user.id, body, requireIdempotencyKey(idempotencyKey));
  }

  /**
   * Affectation du coffre au financement d'une commande.
   *
   * `Idempotency-Key` obligatoire : un double clic ne doit pas débiter le coffre
   * deux fois (`AGENTS.md` §14, §28).
   */
  @Post('use')
  @HttpCode(HttpStatus.CREATED)
  useVault(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(useVaultSchema)) body: UseVaultInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<VaultDto> {
    return this.vault.useVault(user.id, body, requireIdempotencyKey(idempotencyKey));
  }
}
