import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Transicao } from '../iniciativas.types';
import { HistoricoStatus } from './HistoricoStatus';

const base = { ciclo: 1, justificativa: null as string | null };
const transicoes: Transicao[] = [
  {
    ...base,
    id: 't1',
    de: null,
    para: 'EM_ANDAMENTO',
    por: 'Ana Souza',
    nota: 'Submetida e aberta a sugestões',
    ocorreuEm: '2099-01-01T10:00:00.000Z',
  },
  {
    ...base,
    id: 't2',
    de: 'EM_ANDAMENTO',
    para: 'EM_VOTACAO',
    por: 'Sistema',
    nota: 'Prazo de refinamento encerrado',
    ocorreuEm: '2099-01-04T10:00:00.000Z',
  },
  {
    ...base,
    id: 't3',
    de: 'EM_ANALISE',
    para: 'REPROVADA',
    por: 'Elisa Prado',
    nota: 'Reprovada pelo comitê',
    justificativa: 'Sem orçamento.',
    ocorreuEm: '2099-01-08T10:00:00.000Z',
  },
];

describe('HistoricoStatus', () => {
  it('mostra a contagem no resumo e fica recolhido', () => {
    const { container } = render(<HistoricoStatus transicoes={transicoes} />);
    expect(screen.getByText('Histórico de status (3)')).toBeInTheDocument();
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('lista da mais recente para a mais antiga, com origem, nota, autor e justificativa', () => {
    render(<HistoricoStatus transicoes={transicoes} />);
    const itens = screen.getAllByRole('listitem', { hidden: true });
    expect(itens).toHaveLength(3);
    expect(itens[0]).toHaveTextContent('Em análise para Reprovada. Reprovada pelo comitê (Elisa Prado)');
    expect(itens[0]).toHaveTextContent('Justificativa: Sem orçamento.');
    expect(itens[1]).toHaveTextContent(
      'Em andamento para Em votação. Prazo de refinamento encerrado (Sistema)',
    );
    expect(itens[2]).toHaveTextContent('Em andamento. Submetida e aberta a sugestões (Ana Souza)');
    expect(itens[2]).not.toHaveTextContent(' para ');
  });

  it('sem transições mostra zero', () => {
    render(<HistoricoStatus transicoes={[]} />);
    expect(screen.getByText('Histórico de status (0)')).toBeInTheDocument();
  });
});
