import type { Ocorrencia } from './divulgacao.api';

/** Ocorrência semanal com horário, para os testes. */
export const ocorrencia: Ocorrencia = {
  iniciativaId: 'ini-1',
  titulo: 'Semana de Boas-Vindas',
  tipo: 'EVENTO',
  inicio: '2026-11-10T14:00',
  fim: '2026-11-10T16:00',
  diaInteiro: false,
  espaco: 'Auditório do CIn',
  organizadores: 'Bruno Lima',
  periodicidade: 'SEMANAL',
  periodoInicio: '2026-11-10',
  periodoFim: '2026-12-20',
  googleAgendaUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
};
