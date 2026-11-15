import type { EventInput } from '@fullcalendar/core';
import { format } from 'date-fns';
import { useAsync } from '../../hooks/useAsync';
import type { TipoIniciativa, TipoVisual } from '../iniciativas';
import { divulgacaoApi } from './divulgacao.api';
import type { Ocorrencia } from './divulgacao.types';

/** Intervalo visível do calendário: `de` inclusivo e `ate` exclusivo, `YYYY-MM-DD`. */
export interface IntervaloCalendario {
  de: string;
  ate: string;
}

/** Converte o intervalo do FullCalendar (`datesSet`, fim exclusivo) em `de`/`ate`. */
export function intervaloDeDatas(inicio: Date, fim: Date): IntervaloCalendario {
  return { de: format(inicio, 'yyyy-MM-dd'), ate: format(fim, 'yyyy-MM-dd') };
}

/**
 * Converte uma ocorrência do backend em evento do FullCalendar, na cor do tipo (com o texto
 * escuro ou claro, o mais legível). O `fim` das ocorrências de dia inteiro já vem exclusivo,
 * como o FullCalendar espera.
 */
export function ocorrenciaParaEvento(
  ocorrencia: Ocorrencia,
  tipo?: Pick<TipoVisual, 'cor' | 'corTexto'>,
): EventInput {
  return {
    id: `${ocorrencia.iniciativaId}|${ocorrencia.inicio}`,
    title: ocorrencia.titulo,
    start: ocorrencia.inicio,
    end: ocorrencia.fim,
    allDay: ocorrencia.diaInteiro,
    ...(tipo && {
      backgroundColor: tipo.cor,
      borderColor: tipo.cor,
      textColor: tipo.corTexto,
    }),
    extendedProps: { ocorrencia },
  };
}

export interface FiltroCalendario {
  intervalo: IntervaloCalendario | null;
  /** Tipos marcados no filtro. */
  tipos: TipoIniciativa[];
  /** Todos os tipos marcados: não filtra por tipo (inclui os que não estão no cadastro). */
  todosOsTipos: boolean;
  minhas: boolean;
}

/**
 * `GET /divulgacao/ocorrencias` para o intervalo visível. Refaz a busca quando o intervalo,
 * os tipos ou "Só as minhas" mudam. Sem intervalo ou com todos os tipos desmarcados, não chama
 * a API.
 */
export function useOcorrencias({ intervalo, tipos, todosOsTipos, minhas }: FiltroCalendario) {
  const chaveTipos = [...tipos].sort().join(',');
  const { data, isLoading, error, reload } = useAsync<Ocorrencia[]>(async () => {
    if (!intervalo || (!todosOsTipos && tipos.length === 0)) return [];
    return divulgacaoApi.ocorrencias({
      de: intervalo.de,
      ate: intervalo.ate,
      tipos: todosOsTipos ? undefined : tipos,
      minhas: minhas || undefined,
    });
  }, [intervalo?.de, intervalo?.ate, chaveTipos, todosOsTipos, minhas]);

  return { ocorrencias: data ?? [], isLoading, error, reload };
}
