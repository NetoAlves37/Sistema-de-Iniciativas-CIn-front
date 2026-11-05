import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * Tempo restante em texto curto (porte de `fmtRem` do protótipo): "encerrado", "Xd Yh",
 * "Xh Ymin" ou "Xmin" (no mínimo 1min).
 */
export function fmtRem(ms: number): string {
  if (ms <= 0) return 'encerrado';
  const d = Math.floor(ms / DIA);
  const h = Math.floor((ms % DIA) / HORA);
  const m = Math.floor((ms % HORA) / MINUTO);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}min`;
  return `${Math.max(m, 1)}min`;
}

/** Tempo restante até um prazo ISO, a partir de `agora` (injetável nos testes). */
export function restanteAte(prazoIso: string | null, agora: number = Date.now()): string | null {
  if (!prazoIso) return null;
  return fmtRem(new Date(prazoIso).getTime() - agora);
}

/** `dd/mm/aaaa` a partir de `YYYY-MM-DD` (sem passar por fuso). */
export function fmtDia(dia: string | null | undefined): string {
  if (!dia) return '—';
  const [ano, mes, d] = dia.slice(0, 10).split('-');
  return `${d}/${mes}/${ano}`;
}

/** `dd/mm/aaaa HH:mm` (horário local) a partir de um instante ISO. */
export function fmtInstante(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/** Período para exibição: "dd/mm/aaaa" ou "dd/mm/aaaa a dd/mm/aaaa". */
export function fmtPeriodo(inicio: string, fim: string): string {
  return inicio === fim ? fmtDia(inicio) : `${fmtDia(inicio)} a ${fmtDia(fim)}`;
}
