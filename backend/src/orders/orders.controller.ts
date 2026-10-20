// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderInput,
  ListOrdersQuery,
  OrderStatus,
  createOrderSchema,
  listOrdersQuerySchema,
} from './dto/orders.dto';
import { OrderDto } from './orders.mapper';
import { PaginatedDto } from '../common/utils/pagination';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { requireIdempotencyKey } from '../common/utils/idempotency';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<OrderDto> {
    return this.orders.createOrder(user.id, body, requireIdempotencyKey(idempotencyKey));
  }

  @Get()
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listOrdersQuerySchema)) query: ListOrdersQuery,
  ): Promise<PaginatedDto<OrderDto>> {
    return this.orders.listOrders(user.id, query);
  }

  @Get(':id/status')
  getOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ status: OrderStatus; at: string }> {
    return this.orders.getOrderStatus(user.id, id);
  }

  @Get(':id')
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrderDto> {
    return this.orders.getOrder(user.id, id);
  }
}
