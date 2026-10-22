import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useAsync } from '../../hooks/useAsync';
import { setAuthToken } from '../../services/api';
import { meApi } from './me.api';
import type { Me } from './me.types';

export interface MeContextValue {
  /** `undefined` enquanto carrega ou se a chamada falhar. */
  me: Me | undefined;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

const MeContext = createContext<MeContextValue | null>(null);

/**
 * Carrega o usuário autenticado (`GET /me`) uma vez e o compartilha com a árvore. Não
 * bloqueia a renderização: telas que só precisam de nome ou perfil tratam `me` indefinido.
 * Fica dentro do layout autenticado (`PageCin`).
 */
export function MeProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const token = auth.user?.access_token ?? null;

  // Este efeito é do filho e roda antes do efeito do `RouteMap` que registra o token:
  // garante que a primeira chamada já saia autenticada (evita um 401 desnecessário).
  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  const { data, isLoading, error, reload } = useAsync(
    async () => {
      if (!token) return undefined;
      setAuthToken(token);
      return meApi.getMe();
    },
    [token ? 'autenticado' : 'anonimo'],
  );

  return (
    <MeContext.Provider value={{ me: data, isLoading, error, reload }}>
      {children}
    </MeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMe(): MeContextValue {
  const value = useContext(MeContext);
  if (!value) {
    throw new Error('useMe precisa estar dentro de <MeProvider>.');
  }
  return value;
}
