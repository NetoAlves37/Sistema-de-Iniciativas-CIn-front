import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { umDetalhe } from '../detalhe.fixtures';
import { CalloutStatus } from './CalloutStatus';

const AGORA = new Date('2099-01-08T12:00:00.000Z').getTime();

function paragrafos(container: HTMLElement) {
  return Array.from(container.querySelectorAll('p')).map((p) => p.textContent);
}

describe('CalloutStatus', () => {
  it('Em andamento com votação', () => {
    const { container } = render(<CalloutStatus iniciativa={umDetalhe()} agora={AGORA} />);
    const [p1, p2] = paragrafos(container);
    expect(p1).toMatch(
      /^Aberta a sugestões até \d{2}\/\d{2}\/2099 \d{2}:\d{2} \(2d 0h restantes\)\.$/,
    );
    expect(p2).toBe('Depois disso a votação abre automaticamente e a edição é bloqueada.');
  });

  it('Em andamento sem votação: segue para o comitê', () => {
    const { container } = render(
      <CalloutStatus iniciativa={umDetalhe({ comVotacao: false })} agora={AGORA} />,
    );
    expect(paragrafos(container)[1]).toBe(
      'Depois disso a iniciativa segue para o comitê e a edição é bloqueada.',
    );
  });

  it('Em votação', () => {
    const { container } = render(
      <CalloutStatus
        iniciativa={umDetalhe({ status: 'EM_VOTACAO', fimVotacao: '2099-01-09T12:00:00.000Z' })}
        agora={AGORA}
      />,
    );
    const [p1, p2] = paragrafos(container);
    expect(p1).toMatch(/^Votação aberta até \d{2}\/\d{2}\/2099 \d{2}:\d{2} \(1d 0h restantes\)\.$/);
    expect(p2).toBe(
      'Os votos não aprovam nem reprovam; servem para ordenar as iniciativas por relevância.',
    );
  });

  it('Em análise', () => {
    render(<CalloutStatus iniciativa={umDetalhe({ status: 'EM_ANALISE' })} />);
    expect(screen.getByText('Aguardando a decisão do comitê avaliador.')).toBeInTheDocument();
  });

  it('Aprovada', () => {
    const { container } = render(
      <CalloutStatus
        iniciativa={umDetalhe({
          status: 'APROVADA',
          decisao: {
            resultado: 'APROVADA',
            justificativa: null,
            decisor: { nome: 'Carla Dias' },
            decididaEm: '2099-01-05T15:30:00.000Z',
          },
        })}
      />,
    );
    expect(paragrafos(container)[0]).toMatch(
      /^Aprovada em \d{2}\/\d{2}\/2099 \d{2}:\d{2} por Carla Dias, em nome do comitê\. Já aparece em Iniciativas aprovadas e no Calendário\.$/,
    );
  });

  const reprovada = (podeRessubmeter: boolean) =>
    umDetalhe({
      status: 'REPROVADA',
      decisao: {
        resultado: 'REPROVADA',
        justificativa: 'Faltou detalhar o orçamento.',
        decisor: { nome: 'Elisa Prado' },
        decididaEm: '2099-01-05T15:30:00.000Z',
      },
      permissoes: { ...umDetalhe().permissoes, podeRessubmeter },
    });

  it('Reprovada para o autor inclui o convite a ressubmeter', () => {
    const { container } = render(<CalloutStatus iniciativa={reprovada(true)} />);
    const [p1, p2, p3] = paragrafos(container);
    expect(p1).toMatch(
      /^Reprovada em \d{2}\/\d{2}\/2099 \d{2}:\d{2} por Elisa Prado, em nome do comitê\.$/,
    );
    expect(p2).toBe('Justificativa: Faltou detalhar o orçamento.');
    expect(p3).toBe(
      'Você pode editar e ressubmeter quantas vezes quiser. A iniciativa volta para sugestões e votação.',
    );
  });

  it('Reprovada para os demais não mostra o convite', () => {
    const { container } = render(<CalloutStatus iniciativa={reprovada(false)} />);
    expect(paragrafos(container)).toHaveLength(2);
  });
});
