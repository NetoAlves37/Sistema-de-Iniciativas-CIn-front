import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { umDetalhe } from '../detalhe.fixtures';
import { DadosIniciativa } from './DadosIniciativa';

describe('DadosIniciativa', () => {
  it('mostra todos os campos, com período e horário formatados', () => {
    render(<DadosIniciativa iniciativa={umDetalhe()} />);
    expect(screen.getByText('Evento')).toBeInTheDocument();
    expect(screen.getByText('Evento único')).toBeInTheDocument();
    expect(screen.getByText('10/02/2099 a 12/02/2099, das 09:00 às 17:00')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Auditório do CIn')).toBeInTheDocument();
    expect(screen.getByText('Ana, Bruno')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('período de um dia, sem horário e sem membros', () => {
    render(
      <DadosIniciativa
        iniciativa={umDetalhe({
          fim: '2099-02-10',
          horaInicio: null,
          horaFim: null,
          membros: null,
          comVotacao: false,
        })}
      />,
    );
    expect(screen.getByText('10/02/2099')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/Não: segue direto para o comitê/)).toBeInTheDocument();
  });
});
