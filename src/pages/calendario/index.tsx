import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  CalendarioIniciativas,
  datasAposArrastar,
  datasDaOcorrencia,
  type DestinoArrasto,
  DialogoAlterarDatas,
  type IntervaloCalendario,
  type Ocorrencia,
  ocorrenciaParaEvento,
  PopoverEvento,
  useOcorrencias,
} from '../../modules/divulgacao';
import { useMe } from '../../modules/identidade';
import {
  type DatasIniciativaInput,
  type TipoIniciativa,
  useTipos,
} from '../../modules/iniciativas';
import { Links } from '../../utils/enums';

interface Selecao {
  ocorrencia: Ocorrencia;
  ancora: DOMRect;
}

interface Edicao {
  ocorrencia: Ocorrencia;
  valores: DatasIniciativaInput;
  arrastado: boolean;
}

/**
 * Calendário (HU-19, HU-20): ocorrências das aprovadas no intervalo visível. O comitê e o
 * ADMIN também alteram as datas, pelo popover ou arrastando o evento (a série inteira).
 */
export default function CalendarioPage() {
  const { me } = useMe();
  const podeAlterar = Boolean(me?.ehComite);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [intervalo, setIntervalo] = useState<IntervaloCalendario | null>(null);
  const { todos: tiposCadastrados, visual } = useTipos();
  // Guarda os DESMARCADOS: assim um tipo cadastrado depois já aparece marcado.
  const [desmarcados, setDesmarcados] = useState<ReadonlySet<TipoIniciativa>>(new Set());
  const tipos = useMemo(
    () => tiposCadastrados.map((t) => t.code).filter((code) => !desmarcados.has(code)),
    [tiposCadastrados, desmarcados],
  );
  const todosOsTipos = tiposCadastrados.every((t) => !desmarcados.has(t.code));
  const [minhas, setMinhas] = useState(false);
  const [selecao, setSelecao] = useState<Selecao | null>(null);

  const { ocorrencias, isLoading, error, reload } = useOcorrencias({
    intervalo,
    tipos,
    todosOsTipos,
    minhas,
  });
  const eventos = useMemo(
    () => ocorrencias.map((o) => ocorrenciaParaEvento(o, visual(o.tipo))),
    [ocorrencias, visual],
  );

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

  const aoArrastar = useCallback((ocorrencia: Ocorrencia, destino: DestinoArrasto) => {
    setSelecao(null);
    setEdicao({ ocorrencia, valores: datasAposArrastar(ocorrencia, destino), arrastado: true });
  }, []);

  const alterarDatasDaSelecao = () => {
    if (!selecao) return;
    const { ocorrencia } = selecao;
    setSelecao(null);
    setEdicao({ ocorrencia, valores: datasDaOcorrencia(ocorrencia), arrastado: false });
  };

  const alternarTipo = (tipo: TipoIniciativa) =>
    setDesmarcados((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(tipo)) novos.delete(tipo);
      else novos.add(tipo);
      return novos;
    });

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
        {podeAlterar && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Como membro do comitê, você pode alterar as datas pelo botão "Alterar datas" do evento
            ou arrastando-o para outro dia.
          </p>
        )}
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
            {tiposCadastrados.length === 0 && (
              <p className="py-1 text-sm text-gray-600 dark:text-gray-400">
                Nenhum tipo cadastrado.
              </p>
            )}
            {tiposCadastrados.map((tipo) => (
              <label
                key={tipo.code}
                className="flex cursor-pointer items-center gap-2.5 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={!desmarcados.has(tipo.code)}
                  onChange={() => alternarTipo(tipo.code)}
                  className="h-[18px] w-[18px] accent-red-800"
                />
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: tipo.cor }}
                />
                {tipo.nome}
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
            onArrastar={podeAlterar ? aoArrastar : undefined}
          />
        </div>
      </div>

      {selecao && (
        <PopoverEvento
          ocorrencia={selecao.ocorrencia}
          ancora={selecao.ancora}
          onFechar={() => setSelecao(null)}
          onAlterarDatas={podeAlterar ? alterarDatasDaSelecao : undefined}
        />
      )}

      {edicao && (
        <DialogoAlterarDatas
          ocorrencia={edicao.ocorrencia}
          valoresIniciais={edicao.valores}
          arrastado={edicao.arrastado}
          onFechar={() => setEdicao(null)}
          onSalvo={() => {
            setEdicao(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
