import { api } from '../api'
import type {
  CreateOrderRequest,
  Order,
  OrderQuery,
  OrderStatusResponse,
  Paginated,
} from '../types'

export interface CreateOrderInput extends CreateOrderRequest {
  idempotencyKey: string
}

export const orderService = {
  createOrder(input: CreateOrderInput): Promise<Order> {
    return api.request<Order>({
      method: 'POST',
      path: '/orders',
      body: {
        productId: input.productId,
        financingMode: input.financingMode,
        quantity: input.quantity,
      },
      idempotencyKey: input.idempotencyKey,
    })
  },

  getOrders(query: OrderQuery = {}): Promise<Paginated<Order>> {
    return api.request<Paginated<Order>>({
      method: 'GET',
      path: '/orders',
      query: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
      },
    })
  },

  getOrder(orderId: string): Promise<Order> {
    return api.request<Order>({
      method: 'GET',
      path: `/orders/${orderId}`,
    })
  },

  getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    return api.request<OrderStatusResponse>({
      method: 'GET',
      path: `/orders/${orderId}/status`,
    })
  },
}