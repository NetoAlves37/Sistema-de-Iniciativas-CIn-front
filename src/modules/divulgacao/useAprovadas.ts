import { useEffect, useState } from 'react';
import { useListaPaginada } from '../compartilhado/useListaPaginada';
import type { ResumoIniciativa, TipoIniciativa } from '../iniciativas/iniciativas.types';
import { divulgacaoApi } from './divulgacao.api';

export const ATRASO_BUSCA_MS = 300;

/** Devolve `valor` só depois de `ms` sem mudar (debounce). */
export function useValorComAtraso<T>(valor: T, ms: number = ATRASO_BUSCA_MS): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(timer);
  }, [valor, ms]);
  return atrasado;
}

/**
 * `GET /divulgacao/aprovadas`: busca (com debounce de 300 ms) e tipo filtrados no servidor,
 * com "Ver mais".
 */
export function useAprovadas(filtro: { busca: string; tipo: TipoIniciativa | '' }, limit = 12) {
  const q = useValorComAtraso(filtro.busca.trim());
  const { tipo } = filtro;
  return useListaPaginada<ResumoIniciativa>(
    (page, tam) =>
      divulgacaoApi.aprovadas({ q: q || undefined, tipo: tipo || undefined, page, limit: tam }),
    [q, tipo],
    { limit },
  );
}
