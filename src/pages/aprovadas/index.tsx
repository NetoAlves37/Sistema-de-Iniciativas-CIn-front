import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartaoAprovada, useAprovadas } from '../../modules/divulgacao';
import { ROTULO_TIPO, type TipoIniciativa, TIPOS } from '../../modules/iniciativas';
import { Links } from '../../utils/enums';

const CLASSE_CAMPO =
  'rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-700 focus:ring-1 focus:ring-red-700 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

/** Iniciativas aprovadas (HU-18): busca e tipo no servidor, cartões e "Ver mais". */
export default function AprovadasPage() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoIniciativa | ''>('');
  const { items, isLoading, isLoadingMore, error, temMais, verMais, reload } = useAprovadas({
    busca,
    tipo,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Iniciativas aprovadas
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Todas as iniciativas aprovadas pelo comitê, visíveis a qualquer usuário do sistema.
          </p>
        </div>
        <Link
          to={Links.CALENDARIO}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Ver no calendário
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título, organizador ou espaço"
          aria-label="Buscar"
          className={`${CLASSE_CAMPO} w-full sm:max-w-md`}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoIniciativa | '')}
          aria-label="Filtrar por tipo"
          className={CLASSE_CAMPO}
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO[t]}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && <p className="py-4 text-gray-600 dark:text-gray-400">Carregando…</p>}

        {!isLoading && error && items.length === 0 && (
          <div role="alert" className="flex flex-col items-start gap-3 py-2">
            <p className="text-red-700 dark:text-red-400">{error.message}</p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar de novo
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <p className="py-4 text-gray-600 dark:text-gray-400">
            Nenhuma iniciativa aprovada corresponde à busca.
          </p>
        )}

        {items.length > 0 && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {items.map((iniciativa) => (
              <li key={iniciativa.id} className="flex">
                <CartaoAprovada iniciativa={iniciativa} />
              </li>
            ))}
          </ul>
        )}

        {error && items.length > 0 && (
          <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error.message}
          </p>
        )}
      </div>

      {temMais && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={verMais}
            disabled={isLoadingMore}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {isLoadingMore ? 'Carregando…' : 'Ver mais'}
          </button>
        </div>
      )}
    </div>
  );
}
