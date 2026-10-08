import { api } from './client';
import type { Pool, PoolInput } from './types';

export async function listPools(): Promise<Pool[]> {
  const { data } = await api.get<Pool[]>('/pools');
  return data;
}

export async function getPool(id: string): Promise<Pool> {
  const { data } = await api.get<Pool>(`/pools/${encodeURIComponent(id)}`);
  return data;
}

export async function createPool(input: PoolInput): Promise<Pool> {
  const { data } = await api.post<Pool>('/pools', input);
  return data;
}

export async function updatePool(id: string, input: Partial<PoolInput>): Promise<Pool> {
  const { data } = await api.patch<Pool>(`/pools/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deletePool(id: string): Promise<void> {
  await api.delete(`/pools/${encodeURIComponent(id)}`);
}
