import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated } from '../../services/api';
import { iniciativasApi } from './iniciativas.api';
import type { OrdenacaoIniciativas, ResumoIniciativa, StatusIniciativa } from './iniciativas.types';

type Meta = Paginated<unknown>['meta'];

export interface OpcoesPaginacao {
  /** Itens por página (padrão 10). */
  limit?: number;
  /**
   * Recarga automática, em ms. Atualiza em silêncio tudo o que já está carregado, e só
   * quando nenhum campo de formulário tem o foco (não atrapalha quem está digitando).
   */
  recarregarACada?: number;
}

export interface ListaPaginada<T, M extends Meta> {
  items: T[];
  total: number;
  /** Meta da última resposta (por exemplo `contagemPorStatus` em "minhas"). */
  meta: M | null;
  /** Carregando a primeira página (ou depois de mudar os filtros). */
  isLoading: boolean;
  /** Carregando a próxima página ("Ver mais"). */
  isLoadingMore: boolean;
  error: Error | null;
  temMais: boolean;
  verMais: () => void;
  /** Refaz a busca desde a primeira página, mostrando o estado de carregamento. */
  reload: () => void;
}

const CAMPOS_DE_TEXTO = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Há um campo de formulário com foco? Nesse caso a recarga automática espera. */
export function haCampoComFoco(): boolean {
  const ativo = document.activeElement;
  return (
    !!ativo && (CAMPOS_DE_TEXTO.has(ativo.tagName) || (ativo as HTMLElement).isContentEditable)
  );
}

/**
 * Lista paginada no servidor com acúmulo ("Ver mais" anexa a próxima página). Refaz tudo
 * quando `deps` muda, ignora respostas de requisições obsoletas e, opcionalmente, recarrega
 * sozinha. A paginação, os filtros e a ordem são sempre do servidor (RNF-05).
 */
export function useListaPaginada<T, M extends Meta = Meta>(
  buscar: (page: number, limit: number) => Promise<Paginated<T> & { meta: M }>,
  deps: unknown[],
  { limit = 10, recarregarACada }: OpcoesPaginacao = {},
): ListaPaginada<T, M> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<M | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  });
  const paginaRef = useRef(1);
  const requisicaoRef = useRef(0);

  useEffect(() => {
    const id = ++requisicaoRef.current;
    let cancelado = false;
    paginaRef.current = 1;

    async function carregar() {
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);
      try {
        const resposta = await buscarRef.current(1, limit);
        if (cancelado || id !== requisicaoRef.current) return;
        setItems(resposta.items);
        setTotal(resposta.meta.total);
        setMeta(resposta.meta);
      } catch (err) {
        if (cancelado || id !== requisicaoRef.current) return;
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err : new Error('Erro inesperado.'));
      } finally {
        if (!cancelado && id === requisicaoRef.current) setIsLoading(false);
      }
    }

    void carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, limit, reloadToken]);

  const verMais = useCallback(() => {
    if (isLoading || isLoadingMore) return;
    const id = ++requisicaoRef.current;
    const proxima = paginaRef.current + 1;

    async function carregar() {
      setIsLoadingMore(true);
      setError(null);
      try {
        const resposta = await buscarRef.current(proxima, limit);
        if (id !== requisicaoRef.current) return;
        paginaRef.current = proxima;
        setItems((atuais) => [...atuais, ...resposta.items]);
        setTotal(resposta.meta.total);
        setMeta(resposta.meta);
      } catch (err) {
        if (id !== requisicaoRef.current) return;
        setError(err instanceof Error ? err : new Error('Erro inesperado.'));
      } finally {
        if (id === requisicaoRef.current) setIsLoadingMore(false);
      }
    }

    void carregar();
  }, [isLoading, isLoadingMore, limit]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // Recarga automática silenciosa: refaz da primeira página até onde o usuário já carregou.
  useEffect(() => {
    if (!recarregarACada) return;
    const timer = setInterval(() => {
      if (haCampoComFoco()) return;
      const id = ++requisicaoRef.current;
      const paginas = paginaRef.current;
      buscarRef
        .current(1, limit * paginas)
        .then((resposta) => {
          if (id !== requisicaoRef.current) return;
          setItems(resposta.items);
          setTotal(resposta.meta.total);
          setMeta(resposta.meta);
          setError(null);
        })
        .catch(() => {
          // Falha na recarga silenciosa: mantém a lista atual.
        });
    }, recarregarACada);
    return () => clearInterval(timer);
  }, [recarregarACada, limit]);

  return {
    items,
    total,
    meta,
    isLoading,
    isLoadingMore,
    error,
    temMais: items.length < total,
    verMais,
    reload,
  };
}

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
