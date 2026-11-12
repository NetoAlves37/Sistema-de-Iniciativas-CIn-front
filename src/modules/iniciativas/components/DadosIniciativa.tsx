import type { ReactNode } from 'react';
import type { DetalheIniciativa } from '../iniciativas.types';
import { fmtPeriodo } from '../../compartilhado/prazo';
import { ROTULO_PERIODICIDADE, ROTULO_TIPO } from '../rotulos';

function Campo({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <div className={largo ? 'md:col-span-2' : undefined}>
      <dt className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
        {rotulo}
      </dt>
      <dd className="mt-0.5 text-sm break-words whitespace-pre-line text-gray-900 dark:text-gray-100">
        {children}
      </dd>
    </div>
  );
}

/** Período no formato "dd/mm/aaaa a dd/mm/aaaa, das HH:mm às HH:mm". */
function formatarPeriodo(d: Pick<DetalheIniciativa, 'inicio' | 'fim' | 'horaInicio' | 'horaFim'>): string {
  const dias = fmtPeriodo(d.inicio, d.fim);
  return d.horaInicio && d.horaFim ? `${dias}, das ${d.horaInicio} às ${d.horaFim}` : dias;
}

/** Grade somente leitura com todos os campos da iniciativa. */
export function DadosIniciativa({ iniciativa: d }: { iniciativa: DetalheIniciativa }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-4">
      <Campo rotulo="Tipo">{ROTULO_TIPO[d.tipo]}</Campo>
      <Campo rotulo="Título" largo>
        {d.titulo}
      </Campo>
      <Campo rotulo="Quantidade de participantes">{d.participantes || '—'}</Campo>
      <Campo rotulo="Descrição resumida" largo>
        {d.resumo || '—'}
      </Campo>
      <Campo rotulo="Descrição detalhada" largo>
        {d.detalhe || '—'}
      </Campo>
      <Campo rotulo="Período" largo>
        {formatarPeriodo(d)}
      </Campo>
      <Campo rotulo="Periodicidade">{ROTULO_PERIODICIDADE[d.periodicidade]}</Campo>
      <Campo rotulo="Espaço utilizado">{d.espaco || '—'}</Campo>
      <Campo rotulo="Organizadores" largo>
        {d.organizadores || '—'}
      </Campo>
      <Campo rotulo="Membros" largo>
        {d.membros || '—'}
      </Campo>
      <Campo rotulo="Votação geral" largo>
        {d.comVotacao ? 'Sim' : 'Não: segue direto para o comitê ao fim das sugestões'}
      </Campo>
    </dl>
  );
}
