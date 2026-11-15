import type { TipoIniciativa } from '../iniciativas.types';
import { useTipos } from '../useTipos';

/** Chip do tipo da iniciativa, na cor cadastrada (texto escuro ou claro, o mais legível). */
export function TipoChip({ tipo }: { tipo: TipoIniciativa }) {
  const { visual } = useTipos();
  const { nome, cor, corTexto } = visual(tipo);
  return (
    <span
      className="inline-block rounded-[3px] px-2 py-px text-[0.78rem] font-semibold"
      style={{ backgroundColor: cor, color: corTexto }}
    >
      {nome}
    </span>
  );
}
