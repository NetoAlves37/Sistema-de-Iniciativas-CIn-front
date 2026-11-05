import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Ocorrencia } from '../../modules/divulgacao/divulgacao.api';
import { CalendarioIniciativas } from '../../modules/divulgacao/components/CalendarioIniciativas';
import { PopoverEvento } from '../../modules/divulgacao/components/PopoverEvento';
import {
  ocorrenciaParaEvento,
  useOcorrencias,
  type IntervaloCalendario,
} from '../../modules/divulgacao/useOcorrencias';
import type { TipoIniciativa } from '../../modules/iniciativas/iniciativas.types';
import { CLASSE_TIPO, ROTULO_TIPO, TIPOS } from '../../modules/iniciativas/rotulos';
import { Links } from '../../utils/enums';

interface Selecao {
  ocorrencia: Ocorrencia;
  ancora: DOMRect;
}

/** Calendário (HU-19, HU-20): ocorrências das aprovadas no intervalo visível. */
export default function CalendarioPage() {
  const [intervalo, setIntervalo] = useState<IntervaloCalendario | null>(null);
  const [tipos, setTipos] = useState<TipoIniciativa[]>(TIPOS);
  const [minhas, setMinhas] = useState(false);
  const [selecao, setSelecao] = useState<Selecao | null>(null);

  const { ocorrencias, isLoading, error, reload } = useOcorrencias({ intervalo, tipos, minhas });
  const eventos = useMemo(() => ocorrencias.map(ocorrenciaParaEvento), [ocorrencias]);

  const ultimoIntervalo = useRef<IntervaloCalendario | null>(null);
  const aoMudarIntervalo = useCallback((novo: IntervaloCalendario) => {
    // O FullCalendar pode repetir `datesSet` sem mudar as datas: não refaz a busca nem fecha o popover.
    const anterior = ultimoIntervalo.current;
    if (anterior?.de === novo.de && anterior?.ate === novo.ate) return;
    ultimoIntervalo.current = novo;
    setSelecao(null);
    setIntervalo(novo);
  }, []);

  const aoSelecionar = useCallback((ocorrencia: Ocorrencia, elemento: HTMLElement) => {
    setSelecao({ ocorrencia, ancora: elemento.getBoundingClientRect() });
  }, []);

  const alternarTipo = (tipo: TipoIniciativa) =>
    setTipos((atuais) =>
      atuais.includes(tipo) ? atuais.filter((t) => t !== tipo) : [...atuais, tipo],
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Calendário
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Iniciativas aprovadas. Clique em um evento para ver os detalhes ou adicioná-lo ao seu
          Google Agenda.
        </p>
      </div>

      <div className="grid items-start gap-[18px] min-[861px]:grid-cols-[230px_minmax(0,1fr)]">
        <aside aria-label="Filtros do calendário" className="grid gap-4">
          <Link
            to={Links.SUBMETER}
            className="inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Submeter iniciativa
          </Link>

          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">
              Tipos de iniciativa
            </legend>
            {TIPOS.map((tipo) => (
              <label key={tipo} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={tipos.includes(tipo)}
                  onChange={() => alternarTipo(tipo)}
                  className="h-[18px] w-[18px] accent-red-800"
                />
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded-[3px] ${CLASSE_TIPO[tipo]}`}
                />
                {ROTULO_TIPO[tipo]}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">
              Exibir
            </legend>
            <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
              <input
                type="checkbox"
                checked={minhas}
                onChange={(e) => setMinhas(e.target.checked)}
                className="h-[18px] w-[18px] accent-red-800"
              />
              Só as minhas iniciativas
            </label>
          </fieldset>
        </aside>

        <div className="gcal-main min-w-0 rounded-md border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
          <div aria-live="polite" className="min-h-5 text-sm">
            {isLoading && <p className="text-gray-600 dark:text-gray-400">Carregando…</p>}
            {!isLoading && error && (
              <div role="alert" className="mb-2 flex flex-wrap items-center gap-3">
                <p className="text-red-700 dark:text-red-400">{error.message}</p>
                <button
                  type="button"
                  onClick={reload}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Tentar de novo
                </button>
              </div>
            )}
          </div>
          <CalendarioIniciativas
            eventos={eventos}
            onIntervalo={aoMudarIntervalo}
            onSelecionar={aoSelecionar}
          />
        </div>
      </div>

      {selecao && (
        <PopoverEvento
          ocorrencia={selecao.ocorrencia}
          ancora={selecao.ancora}
          onFechar={() => setSelecao(null)}
        />
      )}
    </div>
  );
}
