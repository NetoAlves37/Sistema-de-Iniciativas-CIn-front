import type { EventInput } from '@fullcalendar/core';
import { format } from 'date-fns';
import { useAsync } from '../../hooks/useAsync';
import type { TipoIniciativa } from '../iniciativas/iniciativas.types';
import { TIPOS } from '../iniciativas/rotulos';
import { divulgacaoApi, type Ocorrencia } from './divulgacao.api';

/** Intervalo visível do calendário: `de` inclusivo e `ate` exclusivo, `YYYY-MM-DD`. */
export interface IntervaloCalendario {
  de: string;
  ate: string;
}

/** Sufixo da classe de cor do FullCalendar por tipo (`fc-tp-ext`, `fc-tp-pes`, `fc-tp-evt`). */
export const CLASSE_EVENTO_TIPO: Record<TipoIniciativa, string> = {
  EXTENSAO: 'fc-tp-ext',
  PESQUISA: 'fc-tp-pes',
  EVENTO: 'fc-tp-evt',
};

/** Converte o intervalo do FullCalendar (`datesSet`, fim exclusivo) em `de`/`ate`. */
export function intervaloDeDatas(inicio: Date, fim: Date): IntervaloCalendario {
  return { de: format(inicio, 'yyyy-MM-dd'), ate: format(fim, 'yyyy-MM-dd') };
}

/**
 * Converte uma ocorrência do backend em evento do FullCalendar. O `fim` das ocorrências de
 * dia inteiro já vem exclusivo, como o FullCalendar espera.
 */
export function ocorrenciaParaEvento(ocorrencia: Ocorrencia): EventInput {
  return {
    id: `${ocorrencia.iniciativaId}|${ocorrencia.inicio}`,
    title: ocorrencia.titulo,
    start: ocorrencia.inicio,
    end: ocorrencia.fim,
    allDay: ocorrencia.diaInteiro,
    classNames: [CLASSE_EVENTO_TIPO[ocorrencia.tipo]],
    extendedProps: { ocorrencia },
  };
}

export interface FiltroCalendario {
  intervalo: IntervaloCalendario | null;
  tipos: TipoIniciativa[];
  minhas: boolean;
}

/**
 * `GET /divulgacao/ocorrencias` para o intervalo visível. Refaz a busca quando o intervalo,
 * os tipos ou "Só as minhas" mudam. Sem intervalo ou sem nenhum tipo marcado, não chama a API.
 */
export function useOcorrencias({ intervalo, tipos, minhas }: FiltroCalendario) {
  const todosOsTipos = TIPOS.every((tipo) => tipos.includes(tipo));
  const chaveTipos = [...tipos].sort().join(',');
  const { data, isLoading, error, reload } = useAsync<Ocorrencia[]>(async () => {
    if (!intervalo || tipos.length === 0) return [];
    return divulgacaoApi.ocorrencias({
      de: intervalo.de,
      ate: intervalo.ate,
      tipos: todosOsTipos ? undefined : tipos,
      minhas: minhas || undefined,
    });
  }, [intervalo?.de, intervalo?.ate, chaveTipos, minhas]);

  return { ocorrencias: data ?? [], isLoading, error, reload };
}
