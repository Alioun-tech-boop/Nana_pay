// src/admin/admin.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminQuery, adminQuerySchema } from './dto/admin.dto';
import { PaginatedDto } from '../common/utils/pagination';
import { Roles } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * Espace administrateur.
 *
 * Protégé par `Roles('ADMIN')` (guard global) : un utilisateur sans le rôle
 * ADMIN reçoit `403`. Le frontend peut masquer ces écrans, mais la seule
 * protection réelle est le backend (`AGENTS.md` §18, §19, §46).
 *
 * L'Admin **supervise** : il ne décide jamais d'un crédit (rôle Banque), ne
 * valide jamais un QR, un retrait ou un règlement à la place du backend
 * (`AGENTS.md` §45, §46).
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('summary')
  @Roles('ADMIN')
  async getSummary(): Promise<{
    users: number;
    clients: number;
    merchants: number;
    activeOrders: number;
    paymentsPending: number;
    creditsToReview: number;
    volumeThisMonth: number;
  }> {
    return this.admin.getSummary();
  }

  @Get('users')
  @Roles('ADMIN')
  async listUsers(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      fullName: string;
      email: string | null;
      roles: string[];
      status: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listUsers(query);
  }

  @Get('merchants')
  @Roles('ADMIN')
  async listMerchants(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      name: string;
      email: string | null;
      status: string;
      verified: boolean;
      productsCount: number;
      createdAt: Date;
    }>
  > {
    return this.admin.listMerchants(query);
  }

  @Get('orders')
  @Roles('ADMIN')
  async listOrders(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      reference: string;
      clientFullName: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listOrders(query);
  }

  @Get('payments')
  @Roles('ADMIN')
  async listPayments(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      reference: string | null;
      clientFullName: string;
      amount: number;
      currency: string;
      status: string;
      method: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listPayments(query);
  }

  @Get('credits')
  @Roles('ADMIN')
  async listCredits(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      reference: string;
      clientFullName: string;
      amount: number;
      currency: string;
      status: string;
      termMonths: number;
      createdAt: Date;
    }>
  > {
    return this.admin.listCredits(query);
  }

  @Get('savings')
  @Roles('ADMIN')
  async listSavings(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      orderReference: string;
      clientFullName: string;
      targetAmount: number;
      savedAmount: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listSavings(query);
  }

  @Get('vaults')
  @Roles('ADMIN')
  async listVaults(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      clientFullName: string;
      balance: number;
      eligible: boolean;
      createdAt: Date;
    }>
  > {
    return this.admin.listVaults(query);
  }

  @Get('withdrawals')
  @Roles('ADMIN')
  async listWithdrawals(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      orderReference: string;
      merchantName: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listWithdrawals(query);
  }

  @Get('settlements')
  @Roles('ADMIN')
  async listSettlements(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      merchantName: string;
      amount: number;
      commission: number;
      netAmount: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>
  > {
    return this.admin.listSettlements(query);
  }

  @Get('transactions')
  @Roles('ADMIN')
  async listTransactions(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      vaultId: string;
      type: string;
      amount: number;
      balanceAfter: number;
      createdAt: Date;
    }>
  > {
    return this.admin.listTransactions(query);
  }

  @Get('qr')
  @Roles('ADMIN')
  async listQr(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      orderReference: string;
      state: string;
      expiresAt: Date;
      createdAt: Date;
    }>
  > {
    return this.admin.listQr(query);
  }

  @Get('audit')
  @Roles('ADMIN')
  async listAudit(
    @Query(new ZodValidationPipe(adminQuerySchema)) query: AdminQuery,
  ): Promise<
    PaginatedDto<{
      id: string;
      actorId: string | null;
      action: string;
      scope: string | null;
      targetId: string | null;
      at: Date;
      meta: Record<string, unknown> | null;
    }>
  > {
    return this.admin.listAudit(query);
  }
}
