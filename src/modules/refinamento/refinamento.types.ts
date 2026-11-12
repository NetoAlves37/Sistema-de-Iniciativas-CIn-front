import type { Autor } from '../iniciativas/iniciativas.types';

export interface Comentario {
  id: string;
  ciclo: number;
  autor: Autor & { ehAutorDaIniciativa: boolean };
  texto: string;
  criadoEm: string;
}
