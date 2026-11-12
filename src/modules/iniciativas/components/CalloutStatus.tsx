import type { ReactNode } from 'react';
import type { DetalheIniciativa } from '../iniciativas.types';
import { fmtInstante, restanteAte } from '../../compartilhado';

interface CalloutStatusProps {
  iniciativa: DetalheIniciativa;
  /** Instante de referência do "X restantes" (injetável nos testes). */
  agora?: number;
}

type Tom = 'info' | 'aviso' | 'ok' | 'neutro';

const CLASSE_TOM: Record<Tom, string> = {
  info: 'border-blue-700 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100',
  aviso: 'border-amber-700 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100',
  ok: 'border-green-700 bg-green-50 text-green-950 dark:bg-green-950/40 dark:text-green-100',
  neutro: 'border-gray-500 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100',
};

/** Caixa de destaque reutilizada pelo callout de status e pela justificativa do comitê. */
export function Destaque({ tom = 'neutro', children }: { tom?: Tom; children: ReactNode }) {
  return (
    <div
      className={`my-4 space-y-1 rounded-lg border-l-4 px-4 py-3 text-sm ${CLASSE_TOM[tom]}`}
    >
      {children}
    </div>
  );
}

function restantes(prazo: string | null, agora?: number): string {
  const texto = restanteAte(prazo, agora);
  if (!texto) return '';
  return texto === 'encerrado' ? ' (encerrado)' : ` (${texto} restantes)`;
}

/** Texto de situação conforme o status (e a variante sem votação). */
export function CalloutStatus({ iniciativa, agora }: CalloutStatusProps) {
  const { status, comVotacao, decisao } = iniciativa;

  switch (status) {
    case 'EM_ANDAMENTO':
      return (
        <Destaque tom="aviso">
          <p>
            <strong>Aberta a sugestões até {fmtInstante(iniciativa.fimRefinamento)}</strong>
            {restantes(iniciativa.fimRefinamento, agora)}.
          </p>
          <p>
            {comVotacao
              ? 'Depois disso a votação abre automaticamente e a edição é bloqueada.'
              : 'Depois disso a iniciativa segue para o comitê e a edição é bloqueada.'}
          </p>
        </Destaque>
      );
    case 'EM_VOTACAO':
      return (
        <Destaque tom="info">
          <p>
            <strong>Votação aberta até {fmtInstante(iniciativa.fimVotacao)}</strong>
            {restantes(iniciativa.fimVotacao, agora)}.
          </p>
          <p>
            Os votos não aprovam nem reprovam; servem para ordenar as iniciativas por relevância.
          </p>
        </Destaque>
      );
    case 'EM_ANALISE':
      return (
        <Destaque tom="aviso">
          <p>
            <strong>Aguardando a decisão do comitê avaliador.</strong>
          </p>
        </Destaque>
      );
    case 'APROVADA':
      return (
        <Destaque tom="ok">
          <p>
            <strong>Aprovada em {fmtInstante(decisao?.decididaEm)}</strong> por{' '}
            {decisao?.decisor.nome ?? '—'}, em nome do comitê. Já aparece em Iniciativas aprovadas e
            no Calendário.
          </p>
        </Destaque>
      );
    case 'REPROVADA':
      return (
        <Destaque>
          <p>
            <strong>Reprovada em {fmtInstante(decisao?.decididaEm)}</strong> por{' '}
            {decisao?.decisor.nome ?? '—'}, em nome do comitê.
          </p>
          <p>
            <strong>Justificativa:</strong> {decisao?.justificativa ?? iniciativa.ultimaJustificativa}
          </p>
          {iniciativa.permissoes.podeRessubmeter && (
            <p>
              Você pode editar e ressubmeter quantas vezes quiser. A iniciativa volta para sugestões
              e votação.
            </p>
          )}
        </Destaque>
      );
  }
}
