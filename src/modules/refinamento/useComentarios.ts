import { toast } from '@cincoders/cinnamon';
import { useCallback } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../services/api';
import { useAcao } from '../compartilhado/useAcao';
import { comentariosApi } from './comentarios.api';
import type { Comentario } from './refinamento.types';

interface OpcoesComentarios {
  /** Chamado em 403/409 (por exemplo, "A fase de sugestões terminou."), para recarregar o detalhe. */
  aoConflito?: () => void;
}

/**
 * Sugestões (comentários) de uma iniciativa. `versao` força a recarga da lista (por exemplo,
 * quando o status ou o ciclo mudam).
 */
export function useComentarios(
  iniciativaId: string | undefined,
  versao: string = '',
  { aoConflito }: OpcoesComentarios = {},
) {
  const { data, isLoading, error, reload } = useAsync<{ items: Comentario[]; total: number }>(
    async () => {
      if (!iniciativaId) return { items: [], total: 0 };
      const pagina = await comentariosApi.listar(iniciativaId);
      return { items: pagina.items, total: pagina.meta.total };
    },
    [iniciativaId, versao],
  );

  const { executar, carregando } = useAcao((texto: string) =>
    comentariosApi.comentar(iniciativaId as string, texto),
  );

  /** Envia a sugestão. Devolve `true` se foi registrada; em falha mostra o erro e devolve `false`. */
  const comentar = useCallback(
    async (texto: string): Promise<boolean> => {
      try {
        await executar(texto);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não foi possível enviar a sugestão.');
        if (e instanceof ApiError && (e.status === 403 || e.status === 409)) aoConflito?.();
        return false;
      }
      toast.success('Sugestão enviada');
      reload();
      return true;
    },
    [executar, reload, aoConflito],
  );

  return {
    comentarios: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    reload,
    comentar,
    enviando: carregando,
  };
}
