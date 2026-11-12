import type { Autor } from '../iniciativas';

export interface Comentario {
  id: string;
  ciclo: number;
  autor: Autor & { ehAutorDaIniciativa: boolean };
  texto: string;
  criadoEm: string;
}
