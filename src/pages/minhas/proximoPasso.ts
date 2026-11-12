import type { ResumoIniciativa } from '../../modules/iniciativas';
import { fmtInstante } from '../../modules/compartilhado';

/** Status em que o autor pode editar (ou ressubmeter): ação "Editar" da tabela. */
export function podeEditarNaLista(status: ResumoIniciativa['status']): boolean {
  return status === 'EM_ANDAMENTO' || status === 'REPROVADA';
}

/** Coluna "Próximo passo" de "Minhas iniciativas" (`marco` do protótipo). */
export function proximoPasso(iniciativa: ResumoIniciativa): string {
  switch (iniciativa.status) {
    case 'EM_ANDAMENTO':
      return `Sugestões até ${fmtInstante(iniciativa.fimRefinamento)}`;
    case 'EM_VOTACAO':
      return `Votação até ${fmtInstante(iniciativa.fimVotacao)}`;
    case 'EM_ANALISE':
      return 'Aguardando o comitê';
    case 'APROVADA':
      return iniciativa.decididaEm ? `Aprovada em ${fmtInstante(iniciativa.decididaEm)}` : 'Aprovada';
    case 'REPROVADA':
      return 'Pode editar e ressubmeter';
  }
}
