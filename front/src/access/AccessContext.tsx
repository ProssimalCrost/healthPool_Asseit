import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { verifyAccessKey } from '../api/access';
import { setAccessKey, setInvalidKeyHandler } from '../api/client';
import { clearAccessKey, loadAccessKey, saveAccessKey } from './accessStore';

type AccessState = { status: 'loading' } | { status: 'locked'; reason?: 'invalid' } | { status: 'unlocked' };

interface AccessContextValue {
  state: AccessState;
  /** Confere no servidor e guarda o código. Lança o erro da API se for recusado. */
  unlock: (key: string) => Promise<void>;
  /** Esquece o código neste aparelho (para trocar por outro). */
  lock: () => Promise<void>;
}

const AccessContext = createContext<AccessContextValue | null>(null);

/**
 * Não há contas: a equipe toda usa um código de acesso.
 * O app pede o código uma vez e guarda no aparelho.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AccessState>({ status: 'loading' });

  const forget = useCallback(
    async (reason?: 'invalid') => {
      setAccessKey(null);
      queryClient.clear();
      setState({ status: 'locked', reason });
      await clearAccessKey();
    },
    [queryClient],
  );

  // Código trocado no servidor: qualquer requisição recebe 401 e o app volta a pedir o código.
  useEffect(() => {
    setInvalidKeyHandler(() => void forget('invalid'));
    return () => setInvalidKeyHandler(null);
  }, [forget]);

  useEffect(() => {
    let cancelled = false;
    void loadAccessKey().then((saved) => {
      if (cancelled) return;
      if (saved) {
        setAccessKey(saved);
        setState({ status: 'unlocked' });
      } else {
        setState({ status: 'locked' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = useCallback(async (key: string) => {
    const trimmed = key.trim();
    await verifyAccessKey(trimmed);
    setAccessKey(trimmed);
    await saveAccessKey(trimmed);
    setState({ status: 'unlocked' });
  }, []);

  const lock = useCallback(() => forget(), [forget]);

  const value = useMemo(() => ({ state, unlock, lock }), [state, unlock, lock]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessContextValue {
  const context = useContext(AccessContext);
  if (!context) throw new Error('useAccess precisa estar dentro de <AccessProvider>.');
  return context;
}
