import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { linkDetalhe } from '../../../utils/enums';
import type { ResumoIniciativa } from '../iniciativas.types';
import { restanteAte } from '../../compartilhado';
import { CLASSE_TIPO } from '../rotulos';
import { MiniVotos } from '../../votacao';
import { StatusBadge } from './StatusBadge';
import { TipoChip } from './TipoChip';

interface IniciativaRowProps {
  iniciativa: ResumoIniciativa;
  /** Posição no ranking (mostra "1º", "2º"...). Sem ela, mostra a bolinha colorida do tipo. */
  rank?: number;
  mostrarStatus?: boolean;
  mostrarVotos?: boolean;
  /** Mostra "N sugestões" (iniciativas em refinamento). */
  mostrarSugestoes?: boolean;
  /** Rótulo do prazo, por exemplo "Encerra em" ou "Sugestões até". Usa `prazoAtual`. */
  rotuloPrazo?: string;
  /** Conteúdo extra à direita (tags como "Você é o autor"). */
  extra?: ReactNode;
  /** Instante de referência do prazo (injetável nos testes). */
  agora?: number;
}

/** Linha de lista de iniciativas (início, fila de análise). Toda a linha é um link. */
export function IniciativaRow({
  iniciativa,
  rank,
  mostrarStatus,
  mostrarVotos,
  mostrarSugestoes,
  rotuloPrazo,
  extra,
  agora,
}: IniciativaRowProps) {
  const restante = rotuloPrazo ? restanteAte(iniciativa.prazoAtual, agora) : null;

  return (
    <Link
      to={linkDetalhe(iniciativa.id)}
      className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-gray-200 px-2 py-4 last:border-b-0 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-700 dark:border-gray-800 dark:hover:bg-gray-900"
    >
      {rank ? (
        <span className="w-10 text-lg font-bold text-gray-900 dark:text-gray-100">{rank}º</span>
      ) : (
        <span
          aria-hidden="true"
          className={`mt-1.5 h-3 w-3 rounded-[3px] ${CLASSE_TIPO[iniciativa.tipo]}`}
        />
      )}

      <span className="min-w-0">
        <span className="block font-semibold text-gray-900 dark:text-gray-100">
          {iniciativa.titulo}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <TipoChip tipo={iniciativa.tipo} />
          <span>{iniciativa.autor.nome}</span>
          {mostrarSugestoes && <span>{iniciativa.sugestoesCicloAtual} sugestões</span>}
        </span>
        <span className="mt-1 block text-sm text-gray-700 dark:text-gray-300">
          {iniciativa.resumo}
        </span>
      </span>

      <span className="flex flex-col items-end gap-2 text-sm text-gray-700 dark:text-gray-300">
        {mostrarStatus && <StatusBadge status={iniciativa.status} />}
        {mostrarVotos && (
          <MiniVotos likes={iniciativa.votos.likes} dislikes={iniciativa.votos.dislikes} />
        )}
        {restante && (
          <span>
            {rotuloPrazo} <strong>{restante}</strong>
          </span>
        )}
        {extra}
      </span>
    </Link>
  );
}
