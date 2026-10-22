/** Perfil de exibição do usuário, como devolvido por `GET /me`. */
export type Perfil = 'ALUNO' | 'PROFESSOR' | 'COMITE' | 'ADMIN';

export const PERFIL_LABELS: Record<Perfil, string> = {
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor',
  COMITE: 'Comitê avaliador',
  ADMIN: 'Administrador',
};

/** Prazos configurados no backend, usados nos textos das telas. */
export interface Prazos {
  refinamentoDias: number;
  votacaoDias: number;
}

/** Usuário autenticado. O e-mail nunca trafega (RNF-01). */
export interface Me {
  id: string;
  nome: string;
  perfil: Perfil;
  /** Membro do comitê ou administrador: pode ver a fila e decidir. */
  ehComite: boolean;
  prazos: Prazos;
}
