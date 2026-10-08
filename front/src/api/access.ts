import { ACCESS_KEY_HEADER, api } from './client';

/** Confere o código no servidor antes de salvar. Lança erro 401 se estiver errado. */
export async function verifyAccessKey(key: string): Promise<void> {
  await api.get('health/access', { headers: { [ACCESS_KEY_HEADER]: key } });
}
