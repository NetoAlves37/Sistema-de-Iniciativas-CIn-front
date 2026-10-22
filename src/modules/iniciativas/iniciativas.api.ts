import { API_URL, fetchApi, readData, type Paginated } from '../../services/api';
import { montarQuery } from '../../services/query';
import type {
  ContagemPorStatus,
  DadosIniciativaInput,
  DetalheIniciativa,
  FiltroIniciativas,
  ResumoIniciativa,
  StatusIniciativa,
  Transicao,
} from './iniciativas.types';

/** Resposta de `GET /iniciativas/minhas`: lista paginada mais a contagem por status. */
export interface PaginaMinhas extends Paginated<ResumoIniciativa> {
  meta: Paginated<ResumoIniciativa>['meta'] & { contagemPorStatus: ContagemPorStatus };
}

const json = (corpo: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
});

/**
 * Único lugar que chama o backend para o módulo de iniciativas. Em falha lança `ApiError`
 * (com `status`, `fieldErrors` do 422 e a mensagem pronta para a tela).
 */
export const iniciativasApi = {
  async listar(filtro: FiltroIniciativas = {}): Promise<Paginated<ResumoIniciativa>> {
    const resposta = await fetchApi(`${API_URL}/iniciativas${montarQuery({ ...filtro })}`);
    return readData(resposta, 'Não foi possível carregar as iniciativas.');
  },

  async listarMinhas(
    filtro: { status?: StatusIniciativa; page?: number; limit?: number } = {},
  ): Promise<PaginaMinhas> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/minhas${montarQuery({ ...filtro })}`);
    return readData(resposta, 'Não foi possível carregar as suas iniciativas.');
  },

  /** Quantidade em análise, para o contador do menu do comitê. */
  async contagens(): Promise<{ emAnalise: number }> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/contagens`);
    return readData(resposta, 'Não foi possível carregar as contagens.');
  },

  async obter(id: string): Promise<DetalheIniciativa> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${id}`);
    return readData(resposta, 'Não foi possível carregar a iniciativa.');
  },

  async historico(id: string): Promise<Transicao[]> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${id}/historico`);
    return readData(resposta, 'Não foi possível carregar o histórico.');
  },

  async criar(dados: DadosIniciativaInput): Promise<DetalheIniciativa> {
    const resposta = await fetchApi(`${API_URL}/iniciativas`, { method: 'POST', ...json(dados) });
    return readData(resposta, 'Não foi possível submeter a iniciativa.');
  },

  async atualizar(id: string, dados: DadosIniciativaInput): Promise<DetalheIniciativa> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${id}`, {
      method: 'PATCH',
      ...json(dados),
    });
    return readData(resposta, 'Não foi possível salvar as alterações.');
  },

  async ressubmeter(id: string, dados: DadosIniciativaInput): Promise<DetalheIniciativa> {
    const resposta = await fetchApi(`${API_URL}/iniciativas/${id}/ressubmissao`, {
      method: 'POST',
      ...json(dados),
    });
    return readData(resposta, 'Não foi possível ressubmeter a iniciativa.');
  },
};
