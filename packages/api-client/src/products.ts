import type { Product, ProductListQuery, CreateProductRequest, UpdateProductRequest } from '@repo/types';
import type { ApiClient } from './client';

export class ProductsApi {
  constructor(private client: ApiClient) {}

  async list(query?: ProductListQuery) {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());

    const queryString = params.toString();
    return this.client.get<{ products: Product[]; total: number }>(
      `/v1/products${queryString ? `?${queryString}` : ''}`
    );
  }

  async get(id: string) {
    return this.client.get<Product>(`/v1/products/${id}`);
  }

  async create(data: CreateProductRequest) {
    return this.client.post<Product>('/v1/admin/products', data);
  }

  async update(id: string, data: UpdateProductRequest) {
    return this.client.patch<Product>(`/v1/admin/products/${id}`, data);
  }

  async delete(id: string) {
    return this.client.delete<{ success: boolean }>(`/v1/admin/products/${id}`);
  }
}
