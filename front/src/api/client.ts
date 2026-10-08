import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Endereço da API.
 * - Na nuvem, o app web é servido pelo mesmo servidor da API: basta "/api" (mesmo endereço).
 * - No celular (Expo Go / APK), precisa do endereço completo: https://seu-app.onrender.com/api
 */
const rawBaseURL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? '/api' : undefined);

if (!rawBaseURL) {
  // Falha cedo e com mensagem clara em vez de requisições para "undefined/pools".
  throw new Error('EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env.');
}

/**
 * "localhost" só funciona no navegador. No Expo Go / emulador, "localhost" é o próprio
 * celular, e não o computador onde o back está rodando. Em desenvolvimento, trocamos pelo
 * IP do computador que serve o Expo (o mesmo do QR code). Em produção a URL não é
 * localhost, então nada muda.
 */
function resolveBaseURL(url: string): string {
  if (Platform.OS === 'web') return url;

  const localhost = /\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/;
  if (!localhost.test(url)) return url;

  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) return url.replace(localhost, `//${devHost}`);

  // Emulador Android: 10.0.2.2 é o computador que hospeda o emulador.
  if (Platform.OS === 'android') return url.replace(localhost, '//10.0.2.2');

  return url;
}

export const baseURL = resolveBaseURL(rawBaseURL);

if (__DEV__) {
  console.log('[api] baseURL =', baseURL);
}

export const api = axios.create({ baseURL, timeout: 15_000 });

/** Erro usado quando a resposta não é JSON (ver interceptor abaixo). */
export class UnexpectedResponseError extends Error {
  constructor() {
    super(
      'A API respondeu algo que não é JSON. Confira se EXPO_PUBLIC_API_URL aponta para o back ' +
        `(valor atual: "${baseURL}") e se o servidor está rodando.`,
    );
    this.name = 'UnexpectedResponseError';
  }
}

/** Mesmo nome que o servidor espera (back/src/access/access-key.guard.ts). */
export const ACCESS_KEY_HEADER = 'x-access-key';

let accessKey: string | null = null;
let onInvalidKey: (() => void) | null = null;

export function setAccessKey(key: string | null) {
  accessKey = key;
}

/** Chamado quando o servidor recusa o código (ex.: ele foi trocado na nuvem). */
export function setInvalidKeyHandler(handler: (() => void) | null) {
  onInvalidKey = handler;
}

api.interceptors.request.use((config) => {
  if (accessKey) {
    config.headers[ACCESS_KEY_HEADER] = accessKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Em dev no navegador, se EXPO_PUBLIC_API_URL estiver errado, "/api/..." pode cair no
    // próprio servidor do Expo, que responde 200 com a página HTML do app em vez de JSON.
    // Sem essa checagem o erro só aparece depois, como "x.map is not a function".
    const contentType = response.headers?.['content-type'] ?? response.headers?.['Content-Type'];
    if (typeof contentType === 'string' && !contentType.includes('application/json')) {
      throw new UnexpectedResponseError();
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 && accessKey) {
      onInvalidKey?.();
    }
    return Promise.reject(error);
  },
);
