import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { COR_NEUTRA, corDoTexto } from './cores';
import type { TipoCadastro, TipoIniciativa } from './iniciativas.types';
import { tiposApi } from './tipos.api';

/** Como um tipo aparece na tela: nome, cor de fundo e cor do texto. */
export interface TipoVisual {
  code: TipoIniciativa;
  nome: string;
  cor: string;
  corTexto: string;
  ativo: boolean;
}

interface Estado {
  /** `null` até a primeira carga. */
  tipos: TipoCadastro[] | null;
  carregando: boolean;
  erro: Error | null;
}

// Store do módulo: os tipos mudam pouco e várias telas usam (chips, filtros, formulário,
// calendário), então são carregados uma vez e compartilhados. A tela de cadastro chama
// `recarregarTipos()` depois de cada mudança.
let estado: Estado = { tipos: null, carregando: false, erro: null };
let pendente: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function definir(novo: Partial<Estado>): void {
  estado = { ...estado, ...novo };
  for (const ouvinte of ouvintes) ouvinte();
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Busca os tipos no backend. Chamadas simultâneas compartilham a mesma requisição. */
export function recarregarTipos(): Promise<void> {
  if (pendente) return pendente;
  definir({ carregando: true, erro: null });
  pendente = tiposApi
    .listar()
    .then((tipos) => definir({ tipos, carregando: false }))
    .catch((erro: unknown) =>
      definir({
        carregando: false,
        erro: erro instanceof Error ? erro : new Error('Erro ao carregar os tipos.'),
      }),
    )
    .finally(() => {
      pendente = null;
    });
  return pendente;
}

/** Define os tipos sem chamar o backend (testes). `null` volta ao estado inicial. */
export function semearTipos(tipos: TipoCadastro[] | null): void {
  pendente = null;
  definir({ tipos, carregando: false, erro: null });
}

/** Visual de um código: o do cadastro ou, se não estiver lá, o próprio código em cor neutra. */
export function visualDoTipo(code: TipoIniciativa, tipos: TipoCadastro[] | null): TipoVisual {
  const tipo = tipos?.find((t) => t.code === code);
  if (!tipo) return { code, nome: code, cor: COR_NEUTRA, corTexto: corDoTexto(COR_NEUTRA), ativo: false };
  return { code, nome: tipo.nome, cor: tipo.cor, corTexto: corDoTexto(tipo.cor), ativo: tipo.ativo };
}

/**
 * Tipos de iniciativa do cadastro. Carrega na primeira vez que alguma tela usa.
 * `todos` inclui os inativos (para mostrar iniciativas antigas); `ativos` são os que podem
 * ser escolhidos numa iniciativa nova.
 */
export function useTipos() {
  const atual = useSyncExternalStore(assinar, () => estado);

  useEffect(() => {
    if (estado.tipos === null && !estado.carregando && !estado.erro) void recarregarTipos();
  }, []);

  const todos = useMemo(() => atual.tipos ?? [], [atual.tipos]);
  const ativos = useMemo(() => todos.filter((tipo) => tipo.ativo), [todos]);
  const visual = useCallback((code: TipoIniciativa) => visualDoTipo(code, atual.tipos), [atual.tipos]);

  return {
    todos,
    ativos,
    /** Ainda não carregou nenhuma vez. */
    carregando: atual.tipos === null && atual.erro === null,
    erro: atual.erro,
    visual,
    recarregar: recarregarTipos,
  };
}
