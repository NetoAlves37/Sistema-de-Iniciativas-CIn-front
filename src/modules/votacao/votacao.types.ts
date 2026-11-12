import type { ValorVoto } from '../iniciativas/iniciativas.types';

/** Resultado de `PUT /iniciativas/:id/voto`. */
export interface ResultadoVoto {
  /** 1 (like), -1 (dislike) ou 0 (sem voto). */
  meuVoto: ValorVoto | 0;
  likes: number;
  dislikes: number;
  relevancia: number;
  /** Usada nos toasts: "Voto registrado", "Voto alterado" e "Voto retirado". */
  acao: 'REGISTRADO' | 'ALTERADO' | 'RETIRADO';
}
