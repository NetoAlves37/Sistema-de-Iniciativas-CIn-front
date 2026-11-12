import { toast } from '@cincoders/cinnamon';
import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import type { StatusIniciativa, ValorVoto } from '../iniciativas/iniciativas.types';
import { votoApi } from './voto.api';
import type { ResultadoVoto } from './votacao.types';

export interface EstadoVotos {
  meuVoto: ValorVoto | 0;
  likes: number;
  dislikes: number;
  relevancia: number;
}

const MENSAGEM_ACAO: Record<ResultadoVoto['acao'], string> = {
  REGISTRADO: 'Voto registrado',
  ALTERADO: 'Voto alterado',
  RETIRADO: 'Voto retirado',
};

/** O painel "Interesse da comunidade" aparece em Em votação, ou depois dela se houve votos. */
export function painelVotosVisivel(status: StatusIniciativa, totalVotos: number): boolean {
  if (status === 'EM_VOTACAO') return true;
  return (
    (status === 'EM_ANALISE' || status === 'APROVADA' || status === 'REPROVADA') && totalVotos > 0
  );
}

/**
 * Efeito local de um voto, antes da resposta do servidor: o mesmo valor retira o voto, o
 * valor oposto troca e sem voto registra. A relevância só o servidor calcula.
 */
export function aplicarVotoLocal(estado: EstadoVotos, valor: ValorVoto): EstadoVotos {
  let { likes, dislikes } = estado;
  if (estado.meuVoto === 1) likes -= 1;
  if (estado.meuVoto === -1) dislikes -= 1;
  const meuVoto = estado.meuVoto === valor ? 0 : valor;
  if (meuVoto === 1) likes += 1;
  if (meuVoto === -1) dislikes += 1;
  return { ...estado, meuVoto, likes, dislikes };
}

interface OpcoesVoto {
  /** Chamado em 403/409 (votação encerrada), para recarregar o detalhe. */
  aoConflito?: () => void;
}

/**
 * Voto com atualização otimista: a contagem muda na hora e volta ao valor anterior se o
 * servidor recusar. `base` são os valores vindos do detalhe; quando eles mudam (recarga),
 * o estado local é descartado e vale o do servidor.
 */
export function useVoto(iniciativaId: string, base: EstadoVotos, { aoConflito }: OpcoesVoto = {}) {
  const chave = `${base.meuVoto}|${base.likes}|${base.dislikes}|${base.relevancia}`;
  const [local, setLocal] = useState<{ chave: string; estado: EstadoVotos } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const emVoo = useRef(false);

  const estado = local && local.chave === chave ? local.estado : base;

  const votar = useCallback(
    async (valor: ValorVoto) => {
      if (emVoo.current) return;
      emVoo.current = true;
      setCarregando(true);
      const anterior = local && local.chave === chave ? local.estado : base;
      setLocal({ chave, estado: aplicarVotoLocal(anterior, valor) });
      try {
        const r = await votoApi.votar(iniciativaId, valor);
        setLocal({
          chave,
          estado: {
            meuVoto: r.meuVoto,
            likes: r.likes,
            dislikes: r.dislikes,
            relevancia: r.relevancia,
          },
        });
        toast.success(MENSAGEM_ACAO[r.acao]);
      } catch (e) {
        setLocal({ chave, estado: anterior });
        toast.error(e instanceof Error ? e.message : 'Não foi possível registrar o seu voto.');
        if (e instanceof ApiError && (e.status === 403 || e.status === 409)) aoConflito?.();
      } finally {
        emVoo.current = false;
        setCarregando(false);
      }
    },
    [iniciativaId, chave, base, local, aoConflito],
  );

  return { estado, votar, carregando };
}
