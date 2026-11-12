import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fmtDia } from '../compartilhado/prazo';
import { ROTULO_PERIODICIDADE } from '../iniciativas/rotulos';
import type { Ocorrencia } from './divulgacao.api';

/** `YYYY-MM-DD[...]` como data local (sem passar por UTC). */
function diaLocal(texto: string): Date {
  const [ano, mes, dia] = texto.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Texto de "quando", como o protótipo: "segunda-feira, 10 de novembro, dia todo" etc. */
export function quandoDaOcorrencia(o: Ocorrencia): string {
  const dia = format(diaLocal(o.inicio), "EEEE, d 'de' MMMM", { locale: ptBR });
  if (o.diaInteiro) {
    if (o.periodicidade === 'EVENTO_UNICO' && o.periodoInicio !== o.periodoFim) {
      return `${fmtDia(o.periodoInicio)} a ${fmtDia(o.periodoFim)}, dia todo`;
    }
    return `${dia}, dia todo`;
  }
  return `${dia}, ${o.inicio.slice(11, 16)} às ${o.fim.slice(11, 16)}`;
}

/** "Mensal, até 20/12/2026" (o "até" só aparece quando o período tem mais de um dia). */
export function repeticaoDaOcorrencia(o: Ocorrencia): string {
  const base = ROTULO_PERIODICIDADE[o.periodicidade];
  return o.periodoInicio !== o.periodoFim ? `${base}, até ${fmtDia(o.periodoFim)}` : base;
}
