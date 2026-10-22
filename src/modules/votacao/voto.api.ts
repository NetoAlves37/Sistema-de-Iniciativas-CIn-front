import { API_URL, fetchApi, readData } from '../../services/api';
import type { ValorVoto } from '../iniciativas/iniciativas.types';

/** Resultado de `PUT /iniciativas/:id/voto`. */
export interface ResultadoVoto {
  /** 1 (like), -1 (dislike) ou 0 (sem voto). */
  meuVoto: ValorVoto | 0;
  likes: number;
  dislikes: number;
  relevancia: number;
  /** Usada nos toasts: "Voto registrado", "Voto alterado" e "Voto retirado". */
  acao: 'REGISTRADO' | 'ALTERADO' | 'RETIRADO';
}

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
