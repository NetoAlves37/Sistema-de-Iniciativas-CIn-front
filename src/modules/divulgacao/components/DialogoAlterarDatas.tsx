import { useEffect, useRef, useState } from 'react';
import { toast } from '@cincoders/cinnamon';
import { Loader2, X } from 'lucide-react';
import { ApiError } from '../../../services/api';
import {
  BTN_PRIMARIO,
  BTN_SECUNDARIO,
  CLASSE_AJUDA,
  CLASSE_CAMPO,
  CLASSE_ERRO,
} from '../../compartilhado';
import { type DatasIniciativaInput, ROTULO_PERIODICIDADE, useAlterarDatas } from '../../iniciativas';
import { type ErrosDatas, validarDatas } from '../alterarDatas';
import type { Ocorrencia } from '../divulgacao.types';

type Campo = keyof DatasIniciativaInput;
const CAMPOS: Campo[] = ['inicio', 'fim', 'horaInicio', 'horaFim'];

interface DialogoAlterarDatasProps {
  ocorrencia: Ocorrencia;
  /** Valores iniciais: as datas atuais (botão) ou a proposta depois de arrastar. */
  valoresIniciais: DatasIniciativaInput;
  /** Veio de arrastar um evento: avisa que a mudança ainda não foi salva. */
  arrastado?: boolean;
  onFechar: () => void;
  /** Chamado depois de salvar (para recarregar o calendário). */
  onSalvo: () => void;
}

const SELETOR_FOCAVEL =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Comitê ou ADMIN altera datas e horários de uma aprovada, direto do calendário. Diálogo
 * modal acessível: foco no primeiro campo, Tab preso no diálogo, Esc fecha e o foco volta
 * para onde estava. Vale para a série inteira (todas as ocorrências).
 */
export function DialogoAlterarDatas({
  ocorrencia,
  valoresIniciais,
  arrastado = false,
  onFechar,
  onSalvo,
}: DialogoAlterarDatasProps) {
  const [valores, setValores] = useState<DatasIniciativaInput>(valoresIniciais);
  const [erros, setErros] = useState<ErrosDatas>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const { executar, carregando } = useAlterarDatas();

  const raiz = useRef<HTMLDivElement>(null);
  const campos = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});
  const fechar = useRef(onFechar);
  const ocupado = useRef(carregando);
  useEffect(() => {
    fechar.current = onFechar;
    ocupado.current = carregando;
  });

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    campos.current.inicio?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado.current) {
        e.stopPropagation();
        fechar.current();
        return;
      }
      if (e.key !== 'Tab' || !raiz.current) return;
      const focaveis = [...raiz.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL)];
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar, true);
    return () => {
      document.removeEventListener('keydown', aoTeclar, true);
      if (anterior && document.contains(anterior)) anterior.focus();
    };
  }, []);

  const mudar = (campo: Campo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setValores((atuais) => ({ ...atuais, [campo]: valor || (campo.startsWith('hora') ? null : '') }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  };

  const mostrarErros = (novos: ErrosDatas) => {
    setErros(novos);
    const primeiro = CAMPOS.find((campo) => novos[campo]);
    if (primeiro) campos.current[primeiro]?.focus();
  };

  const aoEnviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErroGeral(null);
    const locais = validarDatas(valores);
    if (Object.keys(locais).length > 0) {
      mostrarErros(locais);
      return;
    }
    try {
      await executar(ocorrencia.iniciativaId, valores);
      toast.success('Datas alteradas.');
      onSalvo();
    } catch (erro) {
      const porCampo = erro instanceof ApiError && erro.status === 422 ? erro.fieldErrors : undefined;
      const doServidor: ErrosDatas = {};
      for (const campo of CAMPOS) {
        const mensagem = porCampo?.[campo]?.[0];
        if (mensagem) doServidor[campo] = mensagem;
      }
      if (Object.keys(doServidor).length > 0) mostrarErros(doServidor);
      else setErroGeral(erro instanceof Error ? erro.message : 'Não foi possível alterar as datas.');
    }
  };

  const aria = (campo: Campo, ajuda: string) => ({
    id: `ad-${campo}`,
    'aria-invalid': erros[campo] ? true : undefined,
    'aria-describedby': [erros[campo] && `ad-${campo}-erro`, ajuda].filter(Boolean).join(' '),
  });
  const erro = (campo: Campo) =>
    erros[campo] ? (
      <p id={`ad-${campo}-erro`} className={CLASSE_ERRO}>
        {erros[campo]}
      </p>
    ) : null;

  const recorrente = ocorrencia.periodicidade !== 'EVENTO_UNICO';
  const legenda = 'mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (!carregando && e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        ref={raiz}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-titulo"
        aria-describedby="ad-descricao"
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h2 id="ad-titulo" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Alterar datas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ocorrencia.titulo}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onFechar}
            disabled={carregando}
            className="cursor-pointer rounded p-1 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-red-700 disabled:cursor-not-allowed dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div id="ad-descricao" className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {arrastado && (
            <p>
              <strong>Ainda não foi salvo.</strong> Confira as novas datas e clique em Salvar.
            </p>
          )}
          <p>
            {recorrente
              ? `Iniciativa ${ROTULO_PERIODICIDADE[ocorrencia.periodicidade].toLowerCase()}: a mudança vale para todas as ocorrências.`
              : 'A mudança aparece no calendário de todos os usuários.'}
          </p>
        </div>

        <form onSubmit={aoEnviar} noValidate className="mt-4 space-y-4">
          <fieldset>
            <legend className={legenda}>Período</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  ref={(el) => {
                    campos.current.inicio = el;
                  }}
                  {...aria('inicio', 'ad-periodo-ajuda')}
                  aria-label="Data de início"
                  type="date"
                  value={valores.inicio}
                  onChange={mudar('inicio')}
                  className={CLASSE_CAMPO}
                />
                {erro('inicio')}
              </div>
              <div>
                <input
                  ref={(el) => {
                    campos.current.fim = el;
                  }}
                  {...aria('fim', 'ad-periodo-ajuda')}
                  aria-label="Data de término"
                  type="date"
                  value={valores.fim}
                  onChange={mudar('fim')}
                  className={CLASSE_CAMPO}
                />
                {erro('fim')}
              </div>
            </div>
            <p id="ad-periodo-ajuda" className={CLASSE_AJUDA}>
              {recorrente ? 'Primeira e última ocorrência.' : 'Início e término.'}
            </p>
          </fieldset>

          <fieldset>
            <legend className={legenda}>
              Horário
              <span className="font-normal text-gray-600 dark:text-gray-400"> (opcional)</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  ref={(el) => {
                    campos.current.horaInicio = el;
                  }}
                  {...aria('horaInicio', 'ad-horario-ajuda')}
                  aria-label="Hora de início"
                  type="time"
                  value={valores.horaInicio ?? ''}
                  onChange={mudar('horaInicio')}
                  className={CLASSE_CAMPO}
                />
                {erro('horaInicio')}
              </div>
              <div>
                <input
                  ref={(el) => {
                    campos.current.horaFim = el;
                  }}
                  {...aria('horaFim', 'ad-horario-ajuda')}
                  aria-label="Hora de término"
                  type="time"
                  value={valores.horaFim ?? ''}
                  onChange={mudar('horaFim')}
                  className={CLASSE_CAMPO}
                />
                {erro('horaFim')}
              </div>
            </div>
            <p id="ad-horario-ajuda" className={CLASSE_AJUDA}>
              Sem horário, a iniciativa aparece como dia inteiro no calendário.
            </p>
          </fieldset>

          {erroGeral && (
            <p role="alert" className={CLASSE_ERRO}>
              {erroGeral}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={onFechar} disabled={carregando} className={BTN_SECUNDARIO}>
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className={BTN_PRIMARIO}>
              {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
