import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type { DetalheIniciativa, ResumoIniciativa } from '../iniciativas/iniciativas.types';

/** Item da fila de análise: o resumo mais a marca de conflito de interesse. */
export interface ItemFila extends ResumoIniciativa {
  /** O usuário logado é o autor (não pode decidir sobre ela). */
  souAutor: boolean;
}

export interface DecisaoInput {
  resultado: 'APROVADA' | 'REPROVADA';
  /** Obrigatória na reprovação (até 2000 caracteres). */
  justificativa?: string;
}

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
