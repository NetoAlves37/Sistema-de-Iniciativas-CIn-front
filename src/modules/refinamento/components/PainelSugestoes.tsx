import { Fragment, useState } from 'react';
import { PERFIL_LABELS } from '../../identidade/me.types';
import { BTN_PRIMARIO, CLASSE_CAMPO, CLASSE_CARTAO, CLASSE_ERRO, CLASSE_TITULO_SECAO } from '../../compartilhado/estilos';
import { fmtInstante } from '../../compartilhado/prazo';
import type { Comentario } from '../comentarios.api';

export const LIMITE_SUGESTAO = 1000;

interface PainelSugestoesProps {
  comentarios: Comentario[];
  /** Ciclo atual da iniciativa: separa os comentários por ciclo quando for maior que 1. */
  cicloAtual: number;
  /** Fase de sugestões aberta (Em andamento): mostra a caixa "Sua sugestão". */
  aberto: boolean;
  enviando?: boolean;
  /** Envia a sugestão e devolve `true` se foi registrada (a caixa só é limpa nesse caso). */
  aoEnviar: (texto: string) => Promise<boolean>;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Sugestões de melhoria: lista agrupada por ciclo e, no refinamento, a caixa para sugerir. */
export function PainelSugestoes({
  comentarios,
  cicloAtual,
  aberto,
  enviando = false,
  aoEnviar,
}: PainelSugestoesProps) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  // Ciclo mais recente primeiro; a ordem dentro do ciclo é a do servidor.
  const ordenados = [...comentarios].sort((a, b) => b.ciclo - a.ciclo);

  const enviar = async () => {
    const limpo = texto.trim();
    if (!limpo) {
      setErro('Escreva sua sugestão antes de enviar.');
      return;
    }
    setErro(null);
    if (await aoEnviar(limpo)) setTexto('');
  };

  return (
    <section aria-labelledby="titulo-sugestoes" className={CLASSE_CARTAO}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-sugestoes" className={CLASSE_TITULO_SECAO}>
          Sugestões de melhoria
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {comentarios.length} comentário(s)
        </span>
      </div>

      {ordenados.length > 0 ? (
        <ul className="space-y-4">
          {ordenados.map((c, i) => {
            const separador = cicloAtual > 1 && (i === 0 || ordenados[i - 1].ciclo !== c.ciclo);
            return (
              <Fragment key={c.id}>
                {separador && (
                  <li
                    className="border-b border-gray-300 pt-2 pb-1 text-xs font-bold tracking-wide text-gray-700 uppercase dark:border-gray-700 dark:text-gray-300"
                  >
                    {c.ciclo === cicloAtual
                      ? `Ciclo ${c.ciclo} (atual)`
                      : `Ciclo ${c.ciclo} (antes da reprovação)`}
                  </li>
                )}
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white dark:bg-gray-200 dark:text-gray-900"
                  >
                    {iniciais(c.autor.nome)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <strong className="text-gray-900 dark:text-gray-100">{c.autor.nome}</strong>
                      <span className="rounded-[3px] bg-gray-200 px-2 py-px text-xs font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                        {c.autor.ehAutorDaIniciativa ? 'Autor' : PERFIL_LABELS[c.autor.perfil]}
                      </span>
                      <time dateTime={c.criadoEm} className="text-gray-600 dark:text-gray-400">
                        {fmtInstante(c.criadoEm)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm break-words whitespace-pre-line text-gray-800 dark:text-gray-200">
                      {c.texto}
                    </p>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ul>
      ) : (
        <p className="py-3 text-sm text-gray-700 dark:text-gray-300">
          {aberto
            ? 'Ainda não há sugestões. Seja o primeiro a contribuir.'
            : 'Nenhuma sugestão foi registrada.'}
        </p>
      )}

      {aberto ? (
        <div className="mt-5">
          <label
            htmlFor="nova-sugestao"
            className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            Sua sugestão
          </label>
          <textarea
            id="nova-sugestao"
            rows={3}
            maxLength={LIMITE_SUGESTAO}
            value={texto}
            placeholder="O que poderia melhorar nesta iniciativa?"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? 'nova-sugestao-erro' : undefined}
            onChange={(e) => setTexto(e.target.value)}
            className={CLASSE_CAMPO}
          />
          {erro && (
            <p id="nova-sugestao-erro" className={CLASSE_ERRO}>
              {erro}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={enviar} disabled={enviando} className={BTN_PRIMARIO}>
              Enviar sugestão
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">A fase de sugestões terminou.</p>
      )}
    </section>
  );
}
