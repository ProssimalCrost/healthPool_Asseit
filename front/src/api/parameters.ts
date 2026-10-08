import { api } from './client';
import type { Parameter, ParameterInput } from './types';

export async function listParameters(): Promise<Parameter[]> {
  const { data } = await api.get<Parameter[]>('/parameters');
  return data;
}

export async function createParameter(input: ParameterInput & { name: string }): Promise<Parameter> {
  const { data } = await api.post<Parameter>('/parameters', input);
  return data;
}

export async function updateParameter(id: string, input: ParameterInput): Promise<Parameter> {
  const { data } = await api.patch<Parameter>(`/parameters/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deleteParameter(id: string): Promise<void> {
  await api.delete(`/parameters/${encodeURIComponent(id)}`);
}
