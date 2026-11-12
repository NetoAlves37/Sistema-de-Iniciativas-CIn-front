import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type { Comentario } from './refinamento.types';

/** Único lugar que chama o backend para as sugestões (comentários) do refinamento. */
export const comentariosApi = {
  async listar(
    iniciativaId: string,
    filtro: { page?: number; limit?: number } = {},
  ): Promise<Paginated<Comentario>> {
    const resposta = await fetchApi(
      `${API_URL}/iniciativas/${iniciativaId}/comentarios${montarQuery({ ...filtro })}`,
    );
    return readData(resposta, 'Não foi possível carregar as sugestões.');
  },

  async comentar(iniciativaId: string, texto: string): Promise<Comentario> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${iniciativaId}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    return readData(resposta, 'Não foi possível enviar a sugestão.');
  },
};
