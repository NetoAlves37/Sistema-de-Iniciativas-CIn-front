import type { Paginated } from '../../services/api';
import type { ResumoIniciativa } from './iniciativas.types';

/** Resumo de iniciativa para os testes (sobrescreva só o que importa). */
export function resumo(sobrescrever: Partial<ResumoIniciativa> = {}): ResumoIniciativa {
  return {
    id: 'ini-1',
    tipo: 'EVENTO',
    titulo: 'Semana de Boas-Vindas',
    resumo: 'Recepção dos calouros.',
    autor: { id: 'u1', nome: 'Bruno Lima', perfil: 'PROFESSOR' },
    status: 'EM_VOTACAO',
    comVotacao: true,
    ciclo: 1,
    fimRefinamento: '2026-10-10T12:00:00.000Z',
    fimVotacao: '2026-10-20T12:00:00.000Z',
    prazoAtual: '2026-10-20T12:00:00.000Z',
    votos: { likes: 18, dislikes: 2, relevancia: 0.71 },
    sugestoesCicloAtual: 2,
    inicio: '2026-11-10',
    fim: '2026-12-20',
    periodicidade: 'SEMANAL',
    espaco: 'Auditório do CIn',
    criadaEm: '2026-10-01T12:00:00.000Z',
    ...sobrescrever,
  };
}

/** Várias iniciativas com ids e títulos distintos. */
export function resumos(
  quantidade: number,
  base: Partial<ResumoIniciativa> = {},
  inicio = 1,
): ResumoIniciativa[] {
  return Array.from({ length: quantidade }, (_, i) =>
    resumo({ id: `ini-${inicio + i}`, titulo: `Iniciativa ${inicio + i}`, ...base }),
  );
}

/** Página no formato da API. */
export function pagina<T>(items: T[], total = items.length, page = 1, limit = 10): Paginated<T> {
  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
