import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  BTN_APROVAR,
  BTN_PRIMARIO,
  BTN_SECUNDARIO,
  CLASSE_CAMPO,
  CLASSE_CARTAO,
  CLASSE_ERRO,
  CLASSE_TITULO_SECAO,
} from '../../compartilhado/estilos';

export const LIMITE_JUSTIFICATIVA = 2000;
const MENSAGEM_JUSTIFICATIVA = 'A justificativa é obrigatória para reprovar.';

interface PainelDecisaoProps {
  /** Título da iniciativa, usado na confirmação da aprovação. */
  titulo: string;
  /** `permissoes.podeDecidir`. */
  podeDecidir: boolean;
  /** `permissoes.motivoNaoPodeDecidir`: mostrado quando não pode decidir. */
  motivoNaoPodeDecidir?: string;
  carregando?: boolean;
  /** Erro de justificativa vindo do servidor (422). */
  erroJustificativa?: string | null;
  aoAprovar: () => Promise<boolean>;
  aoReprovar: (justificativa: string) => Promise<boolean>;
}

/** Decisão do comitê (só aparece para quem é do comitê, com a iniciativa em análise). */
export function PainelDecisao({
  titulo,
  podeDecidir,
  motivoNaoPodeDecidir,
  carregando = false,
  erroJustificativa,
  aoAprovar,
  aoReprovar,
}: PainelDecisaoProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const erro = erroLocal ?? erroJustificativa ?? null;

  const confirmarReprovacao = async () => {
    const texto = justificativa.trim();
    if (!texto) {
      setErroLocal(MENSAGEM_JUSTIFICATIVA);
      return;
    }
    setErroLocal(null);
    if (await aoReprovar(texto)) {
      setReprovando(false);
      setJustificativa('');
    }
  };

  const cancelarReprovacao = () => {
    setReprovando(false);
    setJustificativa('');
    setErroLocal(null);
  };

  return (
    <section aria-labelledby="titulo-decisao" className={CLASSE_CARTAO}>
      <h2 id="titulo-decisao" className={CLASSE_TITULO_SECAO}>
        Decisão do comitê
      </h2>

      {podeDecidir ? (
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Registre a decisão tomada na reunião do comitê. Basta um registro.
        </p>
      ) : (
        <p role="alert" className="mt-1 text-sm font-medium text-red-700 dark:text-red-400">
          {motivoNaoPodeDecidir ?? 'Você não pode registrar a decisão desta iniciativa.'}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={BTN_APROVAR}
          disabled={!podeDecidir || carregando}
          onClick={() => setConfirmando(true)}
        >
          Aprovar
        </button>
        <button
          type="button"
          className={BTN_PRIMARIO}
          disabled={!podeDecidir || carregando}
          aria-expanded={reprovando}
          aria-controls="caixa-justificativa"
          onClick={() => setReprovando(true)}
        >
          Reprovar
        </button>
      </div>

      {podeDecidir && reprovando && (
        <div id="caixa-justificativa" className="mt-4">
          <label
            htmlFor="justificativa"
            className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            Justificativa
          </label>
          <textarea
            id="justificativa"
            rows={4}
            maxLength={LIMITE_JUSTIFICATIVA}
            value={justificativa}
            placeholder="Explique ao autor o motivo e o que pode ser ajustado"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? 'justificativa-erro' : undefined}
            onChange={(e) => {
              setJustificativa(e.target.value);
              setErroLocal(null);
            }}
            className={CLASSE_CAMPO}
          />
          {erro && (
            <p id="justificativa-erro" className={CLASSE_ERRO}>
              {erro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className={BTN_PRIMARIO}
              disabled={carregando}
              onClick={confirmarReprovacao}
            >
              Confirmar reprovação
            </button>
            <button type="button" className={BTN_SECUNDARIO} onClick={cancelarReprovacao}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="Aprovar iniciativa"
        description={`Registrar a aprovação de "${titulo}"?`}
        confirmLabel="Confirmar aprovação"
        onConfirm={() => {
          void aoAprovar();
        }}
      />
    </section>
  );
}
