import { API_URL, fetchApi, readData } from '../../services/api';
import type { TipoCadastro } from './iniciativas.types';

const json = (corpo: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
});

/**
 * Cadastro de tipos de iniciativa (`/tipos-iniciativa`). Qualquer autenticado lista; só o
 * comitê e o ADMIN cadastram, alteram e excluem. Em falha lança `ApiError`.
 */
export const tiposApi = {
  /** Todos os tipos (ativos e inativos), em ordem alfabética, com a contagem de iniciativas. */
  async listar(): Promise<TipoCadastro[]> {
    const resposta = await fetchApi(`${API_URL}/tipos-iniciativa`);
    return readData(resposta, 'Não foi possível carregar os tipos de iniciativa.');
  },

  async cadastrar(dados: { nome: string; cor: string }): Promise<TipoCadastro> {
    const resposta = await fetchApi(`${API_URL}/tipos-iniciativa`, {
      method: 'POST',
      ...json(dados),
    });
    return readData(resposta, 'Não foi possível cadastrar o tipo.');
  },

  /** Só os campos que mudam. Renomear não muda o código do tipo. */
  async alterar(
    id: number,
    dados: { nome?: string; cor?: string; ativo?: boolean },
  ): Promise<TipoCadastro> {
    const resposta = await fetchApi(`${API_URL}/tipos-iniciativa/${id}`, {
      method: 'PATCH',
      ...json(dados),
    });
    return readData(resposta, 'Não foi possível alterar o tipo.');
  },

  /** 409 se houver iniciativas associadas (a mensagem do backend explica). */
  async excluir(id: number): Promise<void> {
    const resposta = await fetchApi(`${API_URL}/tipos-iniciativa/${id}`, { method: 'DELETE' });
    await readData<unknown>(resposta, 'Não foi possível excluir o tipo.');
  },
};
