import { isAxiosError } from 'axios';
import { UnexpectedResponseError } from '../api/client';

type StatusMessages = Partial<Record<number, string>>;

const DEFAULT_MESSAGES: StatusMessages = {
  400: 'Confira os dados informados e tente de novo.',
  401: 'Código de acesso inválido.',
  403: 'Esta ação não é permitida.',
  404: 'Não encontramos o que você procurou.',
  409: 'Este registro já existe.',
  429: 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
};

/** Converte erros da API em mensagens para o usuário, em português. */
export function getErrorMessage(error: unknown, overrides: StatusMessages = {}): string {
  if (error instanceof UnexpectedResponseError) {
    return error.message;
  }
  if (!isAxiosError(error)) {
    return 'Algo deu errado. Tente de novo.';
  }
  if (!error.response) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  const status = error.response.status;
  const message = overrides[status] ?? DEFAULT_MESSAGES[status];
  if (message) return message;
  if (status >= 500) return 'O servidor falhou ao responder. Tente de novo em instantes.';
  return 'Algo deu errado. Tente de novo.';
}
