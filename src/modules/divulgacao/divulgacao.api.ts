import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type {
  Periodicidade,
  ResumoIniciativa,
  TipoIniciativa,
} from '../iniciativas/iniciativas.types';

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

/** Único lugar que chama o backend para a divulgação (aprovadas e calendário). */
export const divulgacaoApi = {
  async aprovadas(
    filtro: { q?: string; tipo?: TipoIniciativa; page?: number; limit?: number } = {},
  ): Promise<Paginated<ResumoIniciativa>> {
    const resposta = await fetchApi(`${API_URL}/divulgacao/aprovadas${montarQuery({ ...filtro })}`);
    return readData(resposta, 'Não foi possível carregar as iniciativas aprovadas.');
  },

  async ocorrencias(filtro: FiltroOcorrencias): Promise<Ocorrencia[]> {
    const resposta = await fetchApi(
      `${API_URL}/divulgacao/ocorrencias${montarQuery({ ...filtro })}`,
    );
    return readData(resposta, 'Não foi possível carregar o calendário.');
  },
};
