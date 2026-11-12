import { useListaPaginada } from '../compartilhado';
import { avaliacaoApi } from './avaliacao.api';
import type { ItemFila } from './avaliacao.types';

/** `GET /avaliacao/fila` (só comitê e administrador), com "Ver mais". */
export function useFila(limit = 20) {
  return useListaPaginada<ItemFila>((page, tam) => avaliacaoApi.fila({ page, limit: tam }), [], {
    limit,
  });
}
