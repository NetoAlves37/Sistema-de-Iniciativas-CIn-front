import { useCallback, useEffect, useRef, useState } from 'react';
import { iniciativasApi } from './iniciativas.api';
import type { DadosIniciativaInput, DetalheIniciativa } from './iniciativas.types';

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

/** `POST /iniciativas`: submete uma nova iniciativa. */
export function useCriarIniciativa(): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.criar(dados));
}

/** `PATCH /iniciativas/:id`: salva a edição (só em Em andamento). */
export function useAtualizarIniciativa(
  id: string,
): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.atualizar(id, dados));
}

/** `POST /iniciativas/:id/ressubmissao`: ressubmete uma iniciativa reprovada. */
export function useRessubmeterIniciativa(
  id: string,
): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.ressubmeter(id, dados));
}
