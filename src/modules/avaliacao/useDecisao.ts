import { toast } from '@cincoders/cinnamon';
import { useCallback, useState } from 'react';
import { ApiError } from '../../services/api';
import { useAcao } from '../compartilhado';
import { avaliacaoApi } from './avaliacao.api';

interface OpcoesDecisao {
  /** Chamado depois de uma decisão registrada, para recarregar o detalhe. */
  aoDecidir?: () => void;
  /** Chamado em 403/409 (já decidida, conflito de interesse), para recarregar o detalhe. */
  aoConflito?: () => void;
}

/** Decisão do comitê: aprovar ou reprovar uma iniciativa em análise. */
export function useDecisao(iniciativaId: string, { aoDecidir, aoConflito }: OpcoesDecisao = {}) {
  const [erroJustificativa, setErroJustificativa] = useState<string | null>(null);
  const { executar, carregando } = useAcao(
    (resultado: 'APROVADA' | 'REPROVADA', justificativa?: string) =>
      avaliacaoApi.decidir(iniciativaId, { resultado, justificativa }),
  );

  const registrar = useCallback(
    async (resultado: 'APROVADA' | 'REPROVADA', justificativa?: string): Promise<boolean> => {
      setErroJustificativa(null);
      try {
        await executar(resultado, justificativa);
      } catch (e) {
        const mensagemCampo =
          e instanceof ApiError ? e.fieldErrors?.justificativa?.[0] : undefined;
        if (mensagemCampo) {
          setErroJustificativa(mensagemCampo);
        } else {
          toast.error(e instanceof Error ? e.message : 'Não foi possível registrar a decisão.');
        }
        if (e instanceof ApiError && (e.status === 403 || e.status === 409)) aoConflito?.();
        return false;
      }
      toast.success(resultado === 'APROVADA' ? 'Iniciativa aprovada' : 'Iniciativa reprovada');
      aoDecidir?.();
      return true;
    },
    [executar, aoDecidir, aoConflito],
  );

  const aprovar = useCallback(() => registrar('APROVADA'), [registrar]);
  const reprovar = useCallback(
    (justificativa: string) => registrar('REPROVADA', justificativa),
    [registrar],
  );

  return { aprovar, reprovar, carregando, erroJustificativa };
}
