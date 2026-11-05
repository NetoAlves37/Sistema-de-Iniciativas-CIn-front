import type { Periodicidade, StatusIniciativa, TipoIniciativa } from './iniciativas.types';

export const STATUS_ORDEM: StatusIniciativa[] = [
  'EM_ANDAMENTO',
  'EM_VOTACAO',
  'EM_ANALISE',
  'APROVADA',
  'REPROVADA',
];

export const TIPOS: TipoIniciativa[] = ['EXTENSAO', 'PESQUISA', 'EVENTO'];

export const PERIODICIDADES: Periodicidade[] = [
  'EVENTO_UNICO',
  'DIARIA',
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
];

export const ROTULO_STATUS: Record<StatusIniciativa, string> = {
  EM_ANDAMENTO: 'Em andamento',
  EM_VOTACAO: 'Em votação',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
};

export const ROTULO_TIPO: Record<TipoIniciativa, string> = {
  EXTENSAO: 'Extensão',
  PESQUISA: 'Pesquisa',
  EVENTO: 'Evento',
};

export const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  EVENTO_UNICO: 'Evento único',
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
};

/**
 * Classes Tailwind por status (cores do protótipo, com contraste ≥ 4,5:1). As variáveis
 * `--st-*` estão em `src/index.css`.
 */
export const CLASSE_STATUS: Record<StatusIniciativa, string> = {
  EM_ANDAMENTO: 'bg-[var(--st-andamento-bg)] text-[var(--st-andamento-fg)]',
  EM_VOTACAO: 'bg-[var(--st-votacao-bg)] text-[var(--st-votacao-fg)]',
  EM_ANALISE: 'bg-[var(--st-analise-bg)] text-[var(--st-analise-fg)]',
  APROVADA: 'bg-[var(--st-aprovada-bg)] text-[var(--st-aprovada-fg)]',
  REPROVADA: 'bg-[var(--st-reprovada-bg)] text-[var(--st-reprovada-fg)]',
};

/** Classes Tailwind por tipo (variáveis `--tp-*` em `src/index.css`). */
export const CLASSE_TIPO: Record<TipoIniciativa, string> = {
  EXTENSAO: 'bg-[var(--tp-ext-bg)] text-[var(--tp-fg)]',
  PESQUISA: 'bg-[var(--tp-pes-bg)] text-[var(--tp-fg)]',
  EVENTO: 'bg-[var(--tp-evt-bg)] text-[var(--tp-fg)]',
};
