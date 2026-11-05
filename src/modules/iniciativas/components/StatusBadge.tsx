import type { StatusIniciativa } from '../iniciativas.types';
import { CLASSE_STATUS, ROTULO_STATUS } from '../rotulos';

/** Selo de status (cores do protótipo, contraste ≥ 4,5:1). */
export function StatusBadge({ status }: { status: StatusIniciativa }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[3px] px-[9px] py-[3px] text-[0.78rem] font-bold ${CLASSE_STATUS[status]}`}
    >
      {ROTULO_STATUS[status]}
    </span>
  );
}
