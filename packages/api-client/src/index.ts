import { ApiClient } from './client';
import { ProductsApi } from './products';
import { CartApi } from './cart';

export function createApiClient(baseUrl: string) {
  const client = new ApiClient(baseUrl);

  return {
    client,
    products: new ProductsApi(client),
    cart: new CartApi(client),
  };
}

export type { ApiClient };
export * from './products';
export * from './cart';
