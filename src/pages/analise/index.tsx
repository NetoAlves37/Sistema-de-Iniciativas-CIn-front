import { RefreshCw } from 'lucide-react';
import { useFila } from '../../modules/avaliacao';
import { IniciativaRow } from '../../modules/iniciativas';

const CLASSE_TAG =
  'inline-block rounded-[3px] px-1.5 text-[0.72rem] font-bold';

/** Iniciativas em análise (HU-12): fila do comitê ordenada por relevância. */
export default function AnalisePage() {
  const { items, total, isLoading, isLoadingMore, error, temMais, verMais, reload } = useFila();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Iniciativas em análise
          {!isLoading && !error && total > 0 && (
            <span className="ml-3 inline-block rounded-full bg-red-700 px-2.5 py-0.5 align-middle text-sm font-bold text-white">
              <span className="sr-only">Aguardando decisão: </span>
              {total}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ordenadas por relevância na votação da comunidade. Os votos são só uma referência para a
          reunião do comitê.
        </p>
      </div>

      <section
        aria-label="Fila de análise"
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
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
              Nenhuma iniciativa aguardando decisão.
            </p>
          )}

          {items.length > 0 && (
            <ul>
              {items.map((iniciativa, indice) => (
                <li key={iniciativa.id}>
                  <IniciativaRow
                    iniciativa={iniciativa}
                    rank={indice + 1}
                    mostrarVotos
                    extra={
                      <>
                        {iniciativa.souAutor && (
                          <span className={`${CLASSE_TAG} bg-red-700 text-white`}>
                            Você é o autor
                          </span>
                        )}
                        {!iniciativa.comVotacao && (
                          <span
                            className={`${CLASSE_TAG} bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100`}
                          >
                            Sem votação
                          </span>
                        )}
                      </>
                    }
                  />
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
          <div className="mt-4 flex justify-center">
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
      </section>
    </div>
  );
}
