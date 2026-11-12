import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type { ResumoIniciativa, TipoIniciativa } from '../iniciativas/iniciativas.types';
import type { FiltroOcorrencias, Ocorrencia } from './divulgacao.types';

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
