import { API_URL, fetchApi, readData } from '../../services/api';
import type { ValorVoto } from '../iniciativas/iniciativas.types';
import type { ResultadoVoto } from './votacao.types';

/** Único lugar que chama o backend para votos. Votar no mesmo valor retira o voto. */
export const votoApi = {
  async votar(iniciativaId: string, valor: ValorVoto): Promise<ResultadoVoto> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${iniciativaId}/voto`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor }),
    });
    return readData(resposta, 'Não foi possível registrar o seu voto.');
  },
};
