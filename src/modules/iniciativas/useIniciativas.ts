import { useListaPaginada, type OpcoesPaginacao } from '../compartilhado/useListaPaginada';
import { iniciativasApi } from './iniciativas.api';
import type { OrdenacaoIniciativas, ResumoIniciativa, StatusIniciativa } from './iniciativas.types';

export interface FiltroListaIniciativas {
  status?: StatusIniciativa;
  ordenar?: OrdenacaoIniciativas;
}

/** `GET /iniciativas` com "Ver mais" e recarga automática opcional (tela Início). */
export function useIniciativas(filtro: FiltroListaIniciativas, opcoes: OpcoesPaginacao = {}) {
  return useListaPaginada<ResumoIniciativa>(
    (page, limit) => iniciativasApi.listar({ ...filtro, page, limit }),
    [filtro.status, filtro.ordenar],
    opcoes,
  );
}
