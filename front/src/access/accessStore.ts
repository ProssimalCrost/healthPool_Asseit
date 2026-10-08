import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// No celular, o código fica no armazenamento seguro (Keychain / Keystore).
// O SecureStore não existe na web, então lá usamos o localStorage do navegador.
const KEY = 'asseit.accessKey';

export async function loadAccessKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    // Armazenamento indisponível (ex.: navegação privada): pede o código de novo.
    return null;
  }
}

export async function saveAccessKey(value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, value);
    else await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Sem como guardar: o código vale só enquanto o app estiver aberto.
  }
}

export async function clearAccessKey(): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // nada a fazer
  }
}
