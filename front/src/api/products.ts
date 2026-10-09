import { api } from './client';
import type { Product, ProductInput, ProductUsagePage } from './types';

export async function listProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products');
  return data;
}

export async function createProduct(input: ProductInput & { name: string; quantity: number }): Promise<Product> {
  const { data } = await api.post<Product>('/products', input);
  return data;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${encodeURIComponent(id)}`);
}

export async function listProductUsages(poolId: string, take = 100): Promise<ProductUsagePage> {
  const { data } = await api.get<ProductUsagePage>('/product-usages', { params: { poolId, take } });
  return data;
}
