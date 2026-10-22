import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('marca a etapa atual com aria-current="step"', () => {
    render(<Stepper status="EM_VOTACAO" comVotacao />);
    const atual = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current'));
    expect(atual).toHaveLength(1);
    expect(atual[0]).toHaveAttribute('aria-current', 'step');
    expect(atual[0]).toHaveTextContent('Em votação');
  });

  it('lista as quatro etapas na ordem', () => {
    render(<Stepper status="EM_ANDAMENTO" comVotacao />);
    const rotulos = screen
      .getAllByRole('listitem')
      .map((li) => li.textContent?.replace(/^[\d✓]+/, ''));
    expect(rotulos).toEqual(['Em andamento', 'Em votação', 'Em análise', 'Aprovada']);
  });

  it('sem votação, a etapa "Em votação" aparece riscada com o rótulo "sem votação"', () => {
    render(<Stepper status="EM_ANALISE" comVotacao={false} />);
    expect(screen.getByText('Em votação')).toHaveClass('line-through');
    expect(screen.getByText('sem votação')).toBeInTheDocument();
    expect(screen.getByText('Em análise').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('com votação, nenhuma etapa é marcada como pulada', () => {
    render(<Stepper status="EM_ANALISE" comVotacao />);
    expect(screen.queryByText('sem votação')).not.toBeInTheDocument();
    expect(screen.getByText('Em votação')).not.toHaveClass('line-through');
  });

  it('a última etapa vira "Reprovada" e é a atual', () => {
    render(<Stepper status="REPROVADA" comVotacao />);
    expect(screen.getByText('Reprovada').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByText('Aprovada')).not.toBeInTheDocument();
  });

  it('aprovada marca a última etapa como atual', () => {
    render(<Stepper status="APROVADA" comVotacao />);
    expect(screen.getByText('Aprovada').closest('li')).toHaveAttribute('aria-current', 'step');
  });
});
