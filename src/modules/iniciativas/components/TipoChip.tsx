import type { TipoIniciativa } from '../iniciativas.types';
import { CLASSE_TIPO, ROTULO_TIPO } from '../rotulos';

/** Chip colorido do tipo da iniciativa (Extensão, Pesquisa ou Evento). */
export function TipoChip({ tipo }: { tipo: TipoIniciativa }) {
  return (
    <span
      className={`inline-block rounded-[3px] px-2 py-px text-[0.78rem] font-semibold ${CLASSE_TIPO[tipo]}`}
    >
      {ROTULO_TIPO[tipo]}
    </span>
  );
}
