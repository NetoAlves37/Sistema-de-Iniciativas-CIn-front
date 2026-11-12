import { useCallback, useEffect, useRef, useState } from 'react';

export interface AcaoAssincrona<A extends unknown[], R> {
  /** Executa a ação. Em falha, guarda o erro em `erro` e o relança (`ApiError` com `status`). */
  executar: (...args: A) => Promise<R>;
  carregando: boolean;
  erro: Error | null;
}

/**
 * Base dos hooks de ação (mutações): controla `carregando` e `erro` e relança a falha para
 * que a tela decida (422 nos campos, 403/409 em toast).
 */
export function useAcao<A extends unknown[], R>(
  acao: (...args: A) => Promise<R>,
): AcaoAssincrona<A, R> {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<Error | null>(null);
  const acaoRef = useRef(acao);
  useEffect(() => {
    acaoRef.current = acao;
  });

  const executar = useCallback(async (...args: A): Promise<R> => {
    setCarregando(true);
    setErro(null);
    try {
      return await acaoRef.current(...args);
    } catch (e) {
      setErro(e instanceof Error ? e : new Error('Erro inesperado.'));
      throw e;
    } finally {
      setCarregando(false);
    }
  }, []);

  return { executar, carregando, erro };
}
