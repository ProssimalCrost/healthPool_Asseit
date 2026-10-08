import { QueryClient, focusManager } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppState } from 'react-native';

// Em React Native não existe "foco da janela": usamos o AppState para refazer
// consultas quando o usuário volta ao app (ex.: dados alterados por outra pessoa da equipe).
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status) => {
    handleFocus(status === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        // Erros 4xx não melhoram tentando de novo.
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status !== undefined && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
