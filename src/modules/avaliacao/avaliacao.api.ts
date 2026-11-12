import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type { DetalheIniciativa } from '../iniciativas/iniciativas.types';
import type { DecisaoInput, ItemFila } from './avaliacao.types';

/** Único lugar que chama o backend para a fila e a decisão do comitê. */
export const avaliacaoApi = {
  async fila(filtro: { page?: number; limit?: number } = {}): Promise<Paginated<ItemFila>> {
    const resposta = await fetchApi(`${API_URL}/avaliacao/fila${montarQuery({ ...filtro })}`);
    return readData(resposta, 'Não foi possível carregar a fila de análise.');
  },

  async decidir(id: string, decisao: DecisaoInput): Promise<DetalheIniciativa> {
    const resposta = await fetchApi(`${API_URL}/avaliacao/${id}/decisao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decisao),
    });
    return readData(resposta, 'Não foi possível registrar a decisão.');
  },
};
