import type { StatusIniciativa } from '../iniciativas.types';

interface StepperProps {
  status: StatusIniciativa;
  comVotacao: boolean;
}

interface Etapa {
  chave: string;
  rotulo: string;
  /** Sem votação, a etapa "Em votação" é pulada. */
  pulada: boolean;
}

/** Etapas do ciclo: Em andamento, Em votação, Em análise e a decisão (Aprovada ou Reprovada). */
export function Stepper({ status, comVotacao }: StepperProps) {
  const final = status === 'REPROVADA' ? 'Reprovada' : 'Aprovada';
  const etapas: Etapa[] = [
    { chave: 'EM_ANDAMENTO', rotulo: 'Em andamento', pulada: false },
    { chave: 'EM_VOTACAO', rotulo: 'Em votação', pulada: !comVotacao },
    { chave: 'EM_ANALISE', rotulo: 'Em análise', pulada: false },
    { chave: 'FINAL', rotulo: final, pulada: false },
  ];
  const atual = status === 'APROVADA' || status === 'REPROVADA' ? 3 : etapas.findIndex((e) => e.chave === status);

  return (
    <ol
      aria-label="Etapas"
      className="my-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300"
    >
      {etapas.map((etapa, i) => {
        const concluida = i < atual && !etapa.pulada;
        const corrente = i === atual;
        const cor = corrente
          ? status === 'REPROVADA'
            ? 'bg-red-700 text-white'
            : status === 'APROVADA'
              ? 'bg-green-700 text-white'
              : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : concluida
            ? 'bg-green-700 text-white'
            : 'border border-gray-400 bg-transparent text-gray-700 dark:text-gray-300';
        return (
          <li
            key={etapa.chave}
            aria-current={corrente ? 'step' : undefined}
            className={`flex items-center gap-2 ${corrente ? 'font-bold text-gray-900 dark:text-gray-100' : ''}`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cor}`}
            >
              {concluida ? '✓' : i + 1}
            </span>
            <span className={etapa.pulada ? 'line-through' : undefined}>{etapa.rotulo}</span>
            {etapa.pulada && <span className="text-xs italic">sem votação</span>}
          </li>
        );
      })}
    </ol>
  );
}
