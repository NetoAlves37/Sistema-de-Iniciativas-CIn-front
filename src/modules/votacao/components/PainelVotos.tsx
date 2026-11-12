import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { CLASSE_CARTAO, CLASSE_TITULO_SECAO } from '../../compartilhado/estilos';
import type { ValorVoto } from '../../iniciativas/iniciativas.types';
import type { EstadoVotos } from '../useVoto';

interface PainelVotosProps {
  votos: EstadoVotos;
  /** A iniciativa está em votação (senão, a votação já encerrou). */
  emVotacao: boolean;
  /** `permissoes.podeVotar`: com `false` os botões ficam desabilitados. */
  podeVotar: boolean;
  carregando?: boolean;
  aoVotar: (valor: ValorVoto) => void;
}

/** "Interesse da comunidade": like e dislike (com retirada), barra de positivos e relevância. */
export function PainelVotos({ votos, emVotacao, podeVotar, carregando = false, aoVotar }: PainelVotosProps) {
  const total = votos.likes + votos.dislikes;
  const percentual = total ? Math.round((votos.likes / total) * 100) : 0;
  const desabilitado = !emVotacao || !podeVotar || carregando;

  const botao = (valor: ValorVoto, rotulo: string, quantidade: number, Icone: typeof ThumbsUp) => {
    const marcado = votos.meuVoto === valor;
    return (
      <button
        type="button"
        aria-pressed={marcado}
        aria-label={`${rotulo}, ${quantidade} votos`}
        disabled={desabilitado}
        onClick={() => aoVotar(valor)}
        className={`inline-flex min-w-20 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60 ${
          marcado
            ? 'border-red-700 bg-red-700 text-white'
            : 'border-gray-400 bg-white text-gray-900 hover:bg-gray-50 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Icone className="h-4 w-4" aria-hidden="true" />
        <span>{quantidade}</span>
      </button>
    );
  };

  return (
    <section aria-labelledby="titulo-votos" className={CLASSE_CARTAO}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-votos" className={CLASSE_TITULO_SECAO}>
          Interesse da comunidade
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {emVotacao ? 'Clique de novo no mesmo botão para retirar seu voto' : 'Votação encerrada'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {botao(1, 'Like', votos.likes, ThumbsUp)}
        {botao(-1, 'Dislike', votos.dislikes, ThumbsDown)}
        <div className="min-w-48 flex-1">
          <div
            aria-hidden="true"
            className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <span
              className="block h-full bg-green-700"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p aria-live="polite" className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {total} voto(s), {percentual}% positivos. Índice de relevância:{' '}
            {Math.round(votos.relevancia * 100)}
          </p>
        </div>
      </div>
    </section>
  );
}
