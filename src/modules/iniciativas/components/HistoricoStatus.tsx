import type { Transicao } from '../iniciativas.types';
import { fmtInstante } from '../../compartilhado/prazo';
import { ROTULO_STATUS } from '../rotulos';

/** Linha do tempo de status, recolhida por padrão. Mais recente primeiro. */
export function HistoricoStatus({ transicoes }: { transicoes: Transicao[] }) {
  const ordenadas = [...transicoes].sort(
    (a, b) => new Date(b.ocorreuEm).getTime() - new Date(a.ocorreuEm).getTime(),
  );

  return (
    <details className="group">
      <summary className="cursor-pointer text-lg font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:text-gray-100">
        Histórico de status ({ordenadas.length})
      </summary>
      <ol className="mt-4 space-y-3">
        {ordenadas.map((t) => (
          <li
            key={t.id}
            className="grid grid-cols-[auto_1fr] gap-x-4 text-sm text-gray-800 dark:text-gray-200"
          >
            <time dateTime={t.ocorreuEm} className="text-gray-600 dark:text-gray-400">
              {fmtInstante(t.ocorreuEm)}
            </time>
            <span>
              {t.de && t.de !== t.para ? `${ROTULO_STATUS[t.de]} para ` : ''}
              <strong>{ROTULO_STATUS[t.para]}</strong>. {t.nota}{' '}
              <span className="text-gray-600 dark:text-gray-400">({t.por})</span>
              {t.justificativa && (
                <span className="mt-1 block text-gray-700 dark:text-gray-300">
                  Justificativa: {t.justificativa}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
