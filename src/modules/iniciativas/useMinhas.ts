import { iniciativasApi, type PaginaMinhas } from './iniciativas.api';
import type { ContagemPorStatus, ResumoIniciativa, StatusIniciativa } from './iniciativas.types';
import { useListaPaginada, type OpcoesPaginacao } from './useIniciativas';

/** Soma das contagens por status: é o "N" do chip "Todas (N)". */
export function totalDasContagens(contagem: ContagemPorStatus | undefined): number {
  return Object.values(contagem ?? {}).reduce((soma, n) => soma + (n ?? 0), 0);
}

/**
 * `GET /iniciativas/minhas`: filtro por status e paginação no servidor, mais
 * `meta.contagemPorStatus` para os chips.
 */
export function useMinhas(status: StatusIniciativa | undefined, opcoes: OpcoesPaginacao = {}) {
  const lista = useListaPaginada<ResumoIniciativa, PaginaMinhas['meta']>(
    (page, limit) => iniciativasApi.listarMinhas({ status, page, limit }),
    [status],
    opcoes,
  );
  return { ...lista, contagemPorStatus: lista.meta?.contagemPorStatus };
}
