import type { Periodicidade, TipoIniciativa } from '../iniciativas';

/** Ocorrência de uma iniciativa aprovada no calendário (`GET /divulgacao/ocorrencias`). */
export interface Ocorrencia {
  iniciativaId: string;
  titulo: string;
  tipo: TipoIniciativa;
  /** `YYYY-MM-DD` (dia inteiro) ou `YYYY-MM-DDTHH:mm` (com horário). */
  inicio: string;
  /** Mesmo formato do início; em eventos de dia inteiro, o fim é exclusivo. */
  fim: string;
  diaInteiro: boolean;
  espaco: string;
  organizadores: string;
  periodicidade: Periodicidade;
  periodoInicio: string;
  periodoFim: string;
  googleAgendaUrl: string;
}

export interface FiltroOcorrencias {
  /** Início do intervalo, `YYYY-MM-DD` (inclusivo). */
  de: string;
  /** Fim do intervalo, `YYYY-MM-DD` (exclusivo). No máximo 62 dias depois de `de`. */
  ate: string;
  tipos?: TipoIniciativa[];
  /** Só as iniciativas do usuário logado. */
  minhas?: boolean;
}
