import { Link } from 'react-router-dom';
import { linkDetalhe } from '../../../utils/enums';
import type { ResumoIniciativa } from '../../iniciativas/iniciativas.types';
import { TipoChip } from '../../iniciativas/components/TipoChip';
import { fmtPeriodo } from '../../iniciativas/prazo';
import { CLASSE_TIPO, ROTULO_PERIODICIDADE } from '../../iniciativas/rotulos';

/** Cartão de iniciativa aprovada: capa colorida pelo tipo com a inicial do título. */
export function CartaoAprovada({ iniciativa }: { iniciativa: ResumoIniciativa }) {
  const inicial = iniciativa.titulo.trim().charAt(0).toUpperCase();
  const periodicidade = ROTULO_PERIODICIDADE[iniciativa.periodicidade].toLowerCase();

  return (
    <Link
      to={linkDetalhe(iniciativa.id)}
      className="flex w-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white text-inherit no-underline hover:border-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-gray-800 dark:bg-gray-900"
    >
      <span
        aria-hidden="true"
        className={`grid h-[120px] place-items-center text-[2.4rem] font-extrabold ${CLASSE_TIPO[iniciativa.tipo]}`}
      >
        {inicial}
      </span>
      <span className="grid gap-1 px-3.5 py-3">
        <span>
          <TipoChip tipo={iniciativa.tipo} />
        </span>
        <b className="text-base text-gray-900 dark:text-gray-100">{iniciativa.titulo}</b>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {fmtPeriodo(iniciativa.inicio, iniciativa.fim)}, {periodicidade}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{iniciativa.espaco}</span>
      </span>
    </Link>
  );
}
