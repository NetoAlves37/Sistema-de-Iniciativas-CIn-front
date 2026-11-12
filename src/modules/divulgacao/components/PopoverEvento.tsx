import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { linkDetalhe } from '../../../utils/enums';
import { CLASSE_TIPO, ROTULO_TIPO } from '../../iniciativas';
import type { Ocorrencia } from '../divulgacao.types';
import { quandoDaOcorrencia, repeticaoDaOcorrencia } from '../ocorrencias.format';

interface PopoverEventoProps {
  ocorrencia: Ocorrencia;
  /** Retângulo do evento clicado, para posicionar o popover ao lado dele. */
  ancora?: DOMRect | null;
  onFechar: () => void;
}

/**
 * Detalhes de uma ocorrência no calendário. Diálogo não modal acessível: o foco vai para o
 * botão fechar, Esc e clique fora fecham, e o foco volta para onde estava.
 */
export function PopoverEvento({ ocorrencia, ancora, onFechar }: PopoverEventoProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const [posicao, setPosicao] = useState<{ left: number; top: number } | null>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    botaoFechar.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar.current();
    };
    const aoClicarFora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) fechar.current();
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('mousedown', aoClicarFora);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('mousedown', aoClicarFora);
      if (anterior && document.contains(anterior)) anterior.focus();
    };
  }, []);

  useLayoutEffect(() => {
    if (!ancora || !raiz.current) return;
    const largura = raiz.current.offsetWidth;
    const altura = raiz.current.offsetHeight;
    let left = ancora.right + 8;
    if (left + largura > window.innerWidth - 12) left = Math.max(12, ancora.left - largura - 8);
    const top = Math.min(Math.max(12, ancora.top), Math.max(12, window.innerHeight - altura - 12));
    setPosicao({ left, top });
  }, [ancora]);

  return (
    <div
      ref={raiz}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ev-pop-titulo"
      style={posicao ? { left: posicao.left, top: posicao.top } : undefined}
      className="ev-pop fixed z-40 w-[340px] max-w-[calc(100vw-24px)] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex justify-end">
        <button
          ref={botaoFechar}
          type="button"
          aria-label="Fechar"
          onClick={onFechar}
          className="cursor-pointer rounded p-1 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-red-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-[16px_1fr] items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-4 w-4 rounded ${CLASSE_TIPO[ocorrencia.tipo]}`}
        />
        <div>
          <h3 id="ev-pop-titulo" className="text-lg leading-snug font-semibold">
            {ocorrencia.titulo}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {quandoDaOcorrencia(ocorrencia)}
          </p>
        </div>
      </div>

      <dl className="mt-3 mb-3.5 ml-7 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-gray-600 dark:text-gray-400">Tipo</dt>
        <dd>{ROTULO_TIPO[ocorrencia.tipo]}</dd>
        <dt className="text-gray-600 dark:text-gray-400">Repete</dt>
        <dd>{repeticaoDaOcorrencia(ocorrencia)}</dd>
        <dt className="text-gray-600 dark:text-gray-400">Local</dt>
        <dd>{ocorrencia.espaco}</dd>
        <dt className="text-gray-600 dark:text-gray-400">Organização</dt>
        <dd>{ocorrencia.organizadores}</dd>
      </dl>

      <div className="ml-7 flex flex-wrap gap-2">
        <Link
          to={linkDetalhe(ocorrencia.iniciativaId)}
          className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Ver iniciativa
        </Link>
        <a
          href={ocorrencia.googleAgendaUrl}
          target="_blank"
          rel="noopener"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Adicionar ao Google Agenda
        </a>
      </div>
    </div>
  );
}
