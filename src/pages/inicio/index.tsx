import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  IniciativaRow,
  type OrdenacaoIniciativas,
  type StatusIniciativa,
  useIniciativas,
} from '../../modules/iniciativas';
import { PERFIL_LABELS, useMe } from '../../modules/identidade';
import { Links } from '../../utils/enums';

const LIMITE_POR_SECAO = 10;
const RECARGA_MS = 60_000;

interface SecaoProps {
  id: string;
  titulo: string;
  dica: string;
  status: StatusIniciativa;
  ordenar: OrdenacaoIniciativas;
  vazio: string;
  ranking?: boolean;
  rotuloPrazo: string;
}

/** Seção de lista do início: 10 itens por vez, "Ver mais", estados de carregando e erro. */
function Secao({ id, titulo, dica, status, ordenar, vazio, ranking, rotuloPrazo }: SecaoProps) {
  const lista = useIniciativas(
    { status, ordenar },
    { limit: LIMITE_POR_SECAO, recarregarACada: RECARGA_MS },
  );
  const { items, isLoading, isLoadingMore, error, temMais, verMais, reload } = lista;

  return (
    <section
      aria-labelledby={id}
      className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {titulo}
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">{dica}</span>
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
          <p className="py-4 text-gray-600 dark:text-gray-400">{vazio}</p>
        )}

        {items.length > 0 && (
          <ul>
            {items.map((iniciativa, indice) => (
              <li key={iniciativa.id}>
                <IniciativaRow
                  iniciativa={iniciativa}
                  rank={ranking ? indice + 1 : undefined}
                  mostrarVotos={ranking}
                  mostrarSugestoes={!ranking}
                  rotuloPrazo={rotuloPrazo}
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
  );
}

/** Início (HU-17): iniciativas em votação (por relevância) e em andamento (por prazo). */
export default function InicioPage() {
  const { me } = useMe();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Iniciativas da comunidade
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sugira melhorias nas iniciativas em andamento e vote nas que estão em votação. Os votos
            mostram o interesse do público e não decidem a aprovação.
          </p>
          {me && (
            <p data-testid="usuario-conectado" className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Conectado como <strong>{me.nome}</strong> ({PERFIL_LABELS[me.perfil]})
            </p>
          )}
        </div>
        <Link
          to={Links.SUBMETER}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Submeter iniciativa
        </Link>
      </div>

      <Secao
        id="secao-votacao"
        titulo="Em votação"
        dica="Ordenadas por relevância"
        status="EM_VOTACAO"
        ordenar="relevancia"
        vazio="Nenhuma iniciativa em votação agora."
        ranking
        rotuloPrazo="Encerra em"
      />
      <Secao
        id="secao-andamento"
        titulo="Em andamento: abertas a sugestões"
        dica="Ordenadas pelo prazo mais próximo"
        status="EM_ANDAMENTO"
        ordenar="prazo"
        vazio="Nenhuma iniciativa recebendo sugestões agora."
        rotuloPrazo="Sugestões até"
      />
    </div>
  );
}
