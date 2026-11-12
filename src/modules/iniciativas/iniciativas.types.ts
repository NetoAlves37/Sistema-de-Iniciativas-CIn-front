import type { Perfil } from '../identidade';

/**
 * Tipos que espelham o contrato HTTP do backend (docs/PROMPT.md, seção 3.10). Não importe
 * nada do backend: o único contrato entre os projetos é a API.
 */

export type StatusIniciativa =
  | 'EM_ANDAMENTO'
  | 'EM_VOTACAO'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'REPROVADA';

export type TipoIniciativa = 'EXTENSAO' | 'PESQUISA' | 'EVENTO';

export type Periodicidade = 'EVENTO_UNICO' | 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL';

export interface Autor {
  id: string;
  nome: string;
  perfil: Perfil;
}

export interface Votos {
  likes: number;
  dislikes: number;
  relevancia: number;
}

/** Item das listas (início, minhas, fila de análise, aprovadas). Datas em ISO. */
export interface ResumoIniciativa {
  id: string;
  tipo: TipoIniciativa;
  titulo: string;
  resumo: string;
  autor: Autor;
  status: StatusIniciativa;
  comVotacao: boolean;
  ciclo: number;
  fimRefinamento: string | null;
  fimVotacao: string | null;
  /** Prazo que importa agora: fim do refinamento em Em andamento, fim da votação em Em votação. */
  prazoAtual: string | null;
  votos: Votos;
  sugestoesCicloAtual: number;
  /** `YYYY-MM-DD` */
  inicio: string;
  fim: string;
  periodicidade: Periodicidade;
  espaco: string;
  criadaEm: string;
  /**
   * Instante da decisão do comitê (ISO). Opcional no contrato: a tela "Minhas iniciativas"
   * usa para "Aprovada em <data>" e, se faltar, mostra só "Aprovada".
   */
  decididaEm?: string | null;
}

export interface Permissoes {
  podeEditar: boolean;
  podeComentar: boolean;
  podeVotar: boolean;
  podeDecidir: boolean;
  /** Presente quando é do comitê, está em análise e não pode decidir (ex.: é o autor). */
  motivoNaoPodeDecidir?: string;
  podeRessubmeter: boolean;
}

export interface Decisao {
  resultado: 'APROVADA' | 'REPROVADA';
  justificativa: string | null;
  decisor: { nome: string };
  decididaEm: string;
}

export type ValorVoto = 1 | -1;

export interface DetalheIniciativa extends ResumoIniciativa {
  detalhe: string;
  /** `HH:mm` ou null (dia inteiro). */
  horaInicio: string | null;
  horaFim: string | null;
  organizadores: string;
  membros: string | null;
  participantes: number;
  /** 1 (like), -1 (dislike) ou 0 (sem voto), no ciclo atual. */
  meuVoto: ValorVoto | 0;
  permissoes: Permissoes;
  decisao: Decisao | null;
  /** Justificativa da última reprovação, para a tela de ressubmissão. */
  ultimaJustificativa: string | null;
  /** Só para aprovadas. */
  googleAgendaUrl: string | null;
}

export interface Transicao {
  id: string;
  ciclo: number;
  de: StatusIniciativa | null;
  para: StatusIniciativa;
  /** Nome do usuário ou `Sistema`. */
  por: string;
  nota: string;
  justificativa: string | null;
  ocorreuEm: string;
}

/** Corpo de `POST /iniciativas`, `PATCH /iniciativas/:id` e `POST /iniciativas/:id/ressubmissao`. */
export interface DadosIniciativaInput {
  tipo: TipoIniciativa;
  titulo: string;
  resumo: string;
  detalhe: string;
  /** `YYYY-MM-DD` */
  inicio: string;
  fim: string;
  /** `HH:mm`; as duas horas vêm juntas ou nenhuma. */
  horaInicio?: string | null;
  horaFim?: string | null;
  periodicidade: Periodicidade;
  espaco: string;
  organizadores: string;
  membros?: string | null;
  participantes: number;
  comVotacao: boolean;
}

export type OrdenacaoIniciativas = 'relevancia' | 'prazo' | 'recentes' | 'inicio';

export interface FiltroIniciativas {
  status?: StatusIniciativa;
  tipo?: TipoIniciativa;
  q?: string;
  ordenar?: OrdenacaoIniciativas;
  page?: number;
  limit?: number;
}

export type ContagemPorStatus = Partial<Record<StatusIniciativa, number>>;
