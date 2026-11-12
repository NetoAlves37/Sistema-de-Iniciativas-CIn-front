import type { ResumoIniciativa } from '../iniciativas/iniciativas.types';

/** Item da fila de análise: o resumo mais a marca de conflito de interesse. */
export interface ItemFila extends ResumoIniciativa {
  /** O usuário logado é o autor (não pode decidir sobre ela). */
  souAutor: boolean;
}

export interface DecisaoInput {
  resultado: 'APROVADA' | 'REPROVADA';
  /** Obrigatória na reprovação (até 2000 caracteres). */
  justificativa?: string;
}
