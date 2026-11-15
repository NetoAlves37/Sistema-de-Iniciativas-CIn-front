import { addDays, addHours, differenceInCalendarDays, format } from 'date-fns';
import type { DatasIniciativaInput } from '../iniciativas';
import type { Ocorrencia } from './divulgacao.types';

/** `YYYY-MM-DD[...]` como data local (sem passar por UTC). */
function diaLocal(texto: string): Date {
  const [ano, mes, dia] = texto.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

const paraDia = (data: Date) => format(data, 'yyyy-MM-dd');

/** Datas e horários atuais da série a que a ocorrência pertence (valores iniciais do formulário). */
export function datasDaOcorrencia(o: Ocorrencia): DatasIniciativaInput {
  return {
    inicio: o.periodoInicio,
    fim: o.periodoFim,
    horaInicio: o.diaInteiro ? null : o.inicio.slice(11, 16),
    horaFim: o.diaInteiro ? null : o.fim.slice(11, 16),
  };
}

/** Onde a ocorrência foi solta ao ser arrastada no calendário. */
export interface DestinoArrasto {
  inicio: Date;
  /** `null` quando o FullCalendar não calcula o fim (por exemplo, de dia inteiro para horário). */
  fim: Date | null;
  diaInteiro: boolean;
}

/**
 * Proposta de novas datas depois de arrastar UMA ocorrência: a série inteira anda o mesmo
 * número de dias. Solta numa faixa de horário, as horas passam a ser as do destino (sem fim
 * calculado, dura 1 hora); solta em "Dia todo", a iniciativa vira de dia inteiro.
 */
export function datasAposArrastar(o: Ocorrencia, destino: DestinoArrasto): DatasIniciativaInput {
  const deslocamento = differenceInCalendarDays(destino.inicio, diaLocal(o.inicio));
  const inicio = paraDia(addDays(diaLocal(o.periodoInicio), deslocamento));
  const fim = paraDia(addDays(diaLocal(o.periodoFim), deslocamento));
  if (destino.diaInteiro) return { inicio, fim, horaInicio: null, horaFim: null };
  const termino = destino.fim ?? addHours(destino.inicio, 1);
  return {
    inicio,
    fim,
    horaInicio: format(destino.inicio, 'HH:mm'),
    horaFim: format(termino, 'HH:mm'),
  };
}

export type ErrosDatas = Partial<Record<keyof DatasIniciativaInput, string>>;

/**
 * Mesmas regras de data e hora do backend (RN-02), com as mesmas mensagens, para avisar antes
 * de enviar. O backend continua sendo quem decide (o 422 dele também chega aos campos).
 */
export function validarDatas(d: DatasIniciativaInput): ErrosDatas {
  const erros: ErrosDatas = {};
  if (!d.inicio) erros.inicio = 'Informe a data de início.';
  if (!d.fim) erros.fim = 'Informe a data de término.';
  else if (d.inicio && d.fim < d.inicio)
    erros.fim = 'A data de término deve ser igual ou posterior à de início.';
  if (d.horaInicio && !d.horaFim) erros.horaFim = 'Informe a hora de término ou apague a de início.';
  else if (!d.horaInicio && d.horaFim)
    erros.horaInicio = 'Informe a hora de início ou apague a de término.';
  else if (d.horaInicio && d.horaFim && d.horaFim <= d.horaInicio)
    erros.horaFim = 'A hora de término deve ser posterior à de início.';
  return erros;
}
