import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '@repo/types';
import type { ApiClient } from './client';

export class CartApi {
  constructor(private client: ApiClient) {}

  async get() {
    return this.client.get<Cart>('/v1/cart');
  }

  async addItem(data: AddToCartRequest) {
    return this.client.post<Cart>('/v1/cart/items', data);
  }

  async updateItem(itemId: string, data: UpdateCartItemRequest) {
    return this.client.patch<Cart>(`/v1/cart/items/${itemId}`, data);
  }

  async removeItem(itemId: string) {
    return this.client.delete<Cart>(`/v1/cart/items/${itemId}`);
  }
}
