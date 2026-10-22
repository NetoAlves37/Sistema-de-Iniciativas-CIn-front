import { useListaPaginada } from '../iniciativas/useIniciativas';
import { avaliacaoApi, type ItemFila } from './avaliacao.api';

/** `GET /avaliacao/fila` (só comitê e administrador), com "Ver mais". */
export function useFila(limit = 20) {
  return useListaPaginada<ItemFila>((page, tam) => avaliacaoApi.fila({ page, limit: tam }), [], {
    limit,
  });
}
