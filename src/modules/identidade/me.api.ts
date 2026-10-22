import { API_URL, fetchApi, readData } from '../../services/api';
import type { Me } from './me.types';

/** Único lugar que chama o backend para o módulo de identidade. */
export const meApi = {
  /** Usuário autenticado (id, nome, perfil, ehComite e prazos). */
  async getMe(): Promise<Me> {
    const response = await fetchApi(`${API_URL}/me`);
    return readData<Me>(response, 'Não foi possível carregar o seu perfil.');
  },
};
