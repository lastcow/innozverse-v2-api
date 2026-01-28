import { z } from 'zod';

export const OrderStatusSchema = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().positive(),
  productSnapshot: z.record(z.unknown()),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: OrderStatusSchema,
  subtotal: z.number().positive(),
  discountAmount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
  placedAt: z.date(),
  updatedAt: z.date(),
  items: z.array(OrderItemSchema),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderRequestSchema = z.object({
  cartId: z.string().uuid(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
