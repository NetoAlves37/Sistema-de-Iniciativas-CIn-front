import type { DetalheIniciativa } from './iniciativas.types';

/** Detalhe de iniciativa para testes (Em andamento, ciclo 1, autor "Ana Souza"). */
export function umDetalhe(parcial: Partial<DetalheIniciativa> = {}): DetalheIniciativa {
  return {
    id: 'ini-1',
    tipo: 'EVENTO',
    titulo: 'Semana de Tecnologia',
    resumo: 'Palestras e oficinas.',
    autor: { id: 'u-ana', nome: 'Ana Souza', perfil: 'ALUNO' },
    status: 'EM_ANDAMENTO',
    comVotacao: true,
    ciclo: 1,
    fimRefinamento: '2099-01-10T12:00:00.000Z',
    fimVotacao: null,
    prazoAtual: '2099-01-10T12:00:00.000Z',
    votos: { likes: 0, dislikes: 0, relevancia: 0 },
    sugestoesCicloAtual: 0,
    inicio: '2099-02-10',
    fim: '2099-02-12',
    periodicidade: 'EVENTO_UNICO',
    espaco: 'Auditório do CIn',
    criadaEm: '2098-12-01T12:00:00.000Z',
    detalhe: 'Descrição detalhada da semana.',
    horaInicio: '09:00',
    horaFim: '17:00',
    organizadores: 'Ana, Bruno',
    membros: 'Carla',
    participantes: 80,
    meuVoto: 0,
    permissoes: {
      podeEditar: false,
      podeComentar: true,
      podeVotar: false,
      podeDecidir: false,
      podeRessubmeter: false,
    },
    decisao: null,
    ultimaJustificativa: null,
    googleAgendaUrl: null,
    ...parcial,
  };
}
