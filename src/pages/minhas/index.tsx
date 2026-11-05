import { useState } from 'react';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ErrorScreen,
  Frame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMessageRow,
  TableRow,
  TableSkeletonRows,
  httpErrors,
} from '@cincoders/cinnamon';
import { EmptyState } from '../../components/EmptyState';
import { MiniVotes } from '../../modules/iniciativas/components/MiniVotes';
import { StatusBadge } from '../../modules/iniciativas/components/StatusBadge';
import { TipoChip } from '../../modules/iniciativas/components/TipoChip';
import type { StatusIniciativa } from '../../modules/iniciativas/iniciativas.types';
import { ROTULO_STATUS, STATUS_ORDEM } from '../../modules/iniciativas/rotulos';
import { totalDasContagens, useMinhas } from '../../modules/iniciativas/useMinhas';
import { Links, linkDetalhe, linkEditar } from '../../utils/enums';
import { podeEditarNaLista, proximoPasso } from './proximoPasso';

const COLUNAS = 6;

const CLASSE_BOTAO_PRIMARIO =
  'inline-flex shrink-0 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700';

function classeChip(ativo: boolean) {
  return `cursor-pointer rounded border px-2.5 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 ${
    ativo
      ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'
  }`;
}

/** Minhas iniciativas (HU-15): chips por status e tabela, com filtro e paginação no servidor. */
export default function MinhasPage() {
  const [filtro, setFiltro] = useState<StatusIniciativa | undefined>(undefined);
  const { items, isLoading, isLoadingMore, error, temMais, verMais, reload, contagemPorStatus } =
    useMinhas(filtro, { limit: 20 });

  const totalGeral = totalDasContagens(contagemPorStatus);
  const nuncaSubmeteu = !isLoading && !error && !filtro && items.length === 0;

  const cabecalho = (comSubtitulo: boolean) => (
    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center dark:border-gray-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Minhas iniciativas
        </h1>
        {comSubtitulo && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Acompanhe o status de cada iniciativa que você propôs.
          </p>
        )}
      </div>
      {comSubtitulo && (
        <Link to={Links.SUBMETER} className={CLASSE_BOTAO_PRIMARIO}>
          Submeter iniciativa
        </Link>
      )}
    </div>
  );

  if (nuncaSubmeteu) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {cabecalho(false)}
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <EmptyState
            icon={FolderOpen}
            title="Você ainda não submeteu nenhuma iniciativa."
            description="Quando você submeter, ela aparece aqui com o status e o próximo passo."
            action={
              <Link to={Links.SUBMETER} className={`${CLASSE_BOTAO_PRIMARIO} mt-4`}>
                Submeter iniciativa
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const statusComIniciativas = STATUS_ORDEM.filter((s) => (contagemPorStatus?.[s] ?? 0) > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {cabecalho(true)}

      <div
        role="group"
        aria-label="Filtrar por status"
        className="mb-4 flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={!filtro}
          className={classeChip(!filtro)}
          onClick={() => setFiltro(undefined)}
        >
          Todas ({totalGeral})
        </button>
        {statusComIniciativas.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={filtro === status}
            className={classeChip(filtro === status)}
            onClick={() => setFiltro(status)}
          >
            {ROTULO_STATUS[status]} ({contagemPorStatus?.[status]})
          </button>
        ))}
      </div>

      <Frame className="w-full">
        <Table variant="card" exportEnabled={false}>
          <TableHeader>
            <TableRow>
              <TableHead>Iniciativa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próximo passo</TableHead>
              <TableHead>Votos</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={COLUNAS} />
            ) : error && items.length === 0 ? (
              <TableMessageRow colSpan={COLUNAS}>
                <div role="alert" className="flex flex-col items-center py-4">
                  <ErrorScreen errorType={httpErrors.SERVER_ERROR} />
                  <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error.message}</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Tentar de novo
                  </button>
                </div>
              </TableMessageRow>
            ) : items.length === 0 ? (
              <TableMessageRow colSpan={COLUNAS}>
                <p className="py-4 text-gray-600 dark:text-gray-400">
                  Nenhuma iniciativa com este status.
                </p>
              </TableMessageRow>
            ) : (
              items.map((iniciativa) => (
                <TableRow key={iniciativa.id}>
                  <TableCell>
                    <Link
                      to={linkDetalhe(iniciativa.id)}
                      className="font-semibold text-red-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-red-700 dark:text-red-300"
                    >
                      {iniciativa.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TipoChip tipo={iniciativa.tipo} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={iniciativa.status} />
                  </TableCell>
                  <TableCell>{proximoPasso(iniciativa)}</TableCell>
                  <TableCell>
                    <MiniVotes
                      likes={iniciativa.votos.likes}
                      dislikes={iniciativa.votos.dislikes}
                    />
                  </TableCell>
                  <TableCell>
                    {podeEditarNaLista(iniciativa.status) && (
                      <Link
                        to={linkEditar(iniciativa.id)}
                        aria-label={`Editar ${iniciativa.titulo}`}
                        className="inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        Editar
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>

      <div aria-live="polite" className="mt-4 flex flex-col items-center gap-2">
        {error && items.length > 0 && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error.message}
          </p>
        )}
        {temMais && (
          <button
            type="button"
            onClick={verMais}
            disabled={isLoadingMore}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {isLoadingMore ? 'Carregando…' : 'Ver mais'}
          </button>
        )}
      </div>
    </div>
  );
}
