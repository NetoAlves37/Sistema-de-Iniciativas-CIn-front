import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { resumo } from '../../iniciativas/iniciativas.fixtures';
import { CartaoAprovada } from './CartaoAprovada';

const renderizar = (i = resumo({ status: 'APROVADA' })) =>
  render(
    <MemoryRouter>
      <CartaoAprovada iniciativa={i} />
    </MemoryRouter>,
  );

describe('<CartaoAprovada>', () => {
  it('mostra capa com a inicial, tipo, título, período com periodicidade em minúsculas e espaço', () => {
    const { container } = renderizar();

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('S');
    expect(screen.getByText('Evento')).toBeInTheDocument();
    expect(screen.getByText('Semana de Boas-Vindas')).toBeInTheDocument();
    expect(screen.getByText('10/11/2026 a 20/12/2026, semanal')).toBeInTheDocument();
    expect(screen.getByText('Auditório do CIn')).toBeInTheDocument();
  });

  it('é um link para o detalhe', () => {
    renderizar(resumo({ id: 'abc', status: 'APROVADA' }));
    expect(screen.getByRole('link')).toHaveAttribute('href', '/iniciativas/abc');
  });

  it('período de um dia só aparece sem "a" e evento único em minúsculas com espaço', () => {
    renderizar(
      resumo({ inicio: '2026-11-10', fim: '2026-11-10', periodicidade: 'EVENTO_UNICO' }),
    );
    expect(screen.getByText('10/11/2026, evento único')).toBeInTheDocument();
  });

  it('usa a cor do tipo na capa', () => {
    const { container } = renderizar(resumo({ tipo: 'PESQUISA' }));
    expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('--tp-pes-bg');
  });
});
