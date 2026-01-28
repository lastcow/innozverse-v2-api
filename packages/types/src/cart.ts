import { z } from 'zod';
import { ProductSchema } from './product';

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  addedAt: z.date(),
  product: ProductSchema.optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  items: z.array(CartItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Cart = z.infer<typeof CartSchema>;

export const AddToCartRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
});
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;
