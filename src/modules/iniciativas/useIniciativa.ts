import { useEffect } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { iniciativasApi } from './iniciativas.api';
import type { DetalheIniciativa, StatusIniciativa, Transicao } from './iniciativas.types';

/** Intervalo da recarga automática do detalhe, para refletir transições por prazo. */
export const INTERVALO_RECARGA_MS = 30_000;

const STATUS_COM_PRAZO: StatusIniciativa[] = ['EM_ANDAMENTO', 'EM_VOTACAO'];

interface OpcoesIniciativa {
  /** Recarrega a cada 30 s enquanto o status for Em andamento ou Em votação. Padrão: sim. */
  atualizarAuto?: boolean;
}

/**
 * Detalhe de uma iniciativa. `isLoading` fica verdadeiro também nas recargas: telas devem
 * mostrar o "carregando" só quando `iniciativa` ainda é indefinida.
 */
export function useIniciativa(
  id: string | undefined,
  { atualizarAuto = true }: OpcoesIniciativa = {},
) {
  const { data, isLoading, error, reload } = useAsync<DetalheIniciativa | undefined>(
    async () => (id ? iniciativasApi.obter(id) : undefined),
    [id],
  );

  const status = data?.status;
  const recarregar = atualizarAuto && status !== undefined && STATUS_COM_PRAZO.includes(status);
  useEffect(() => {
    if (!recarregar) return;
    const timer = setInterval(reload, INTERVALO_RECARGA_MS);
    return () => clearInterval(timer);
  }, [recarregar, reload]);

  return { iniciativa: data, isLoading, error, reload };
}

/** Histórico de status (`GET /iniciativas/:id/historico`). `versao` força a recarga. */
export function useHistorico(id: string | undefined, versao: string = '') {
  const { data, isLoading, error, reload } = useAsync<Transicao[]>(
    async () => (id ? iniciativasApi.historico(id) : []),
    [id, versao],
  );
  return { transicoes: data ?? [], isLoading, error, reload };
}
