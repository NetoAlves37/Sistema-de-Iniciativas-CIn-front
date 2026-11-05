import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ocorrencia } from '../divulgacao.fixtures';
import { ocorrenciaParaEvento } from '../useOcorrencias';
import { CalendarioIniciativas } from './CalendarioIniciativas';

function definirLargura(estreito: boolean) {
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: estreito && consulta.includes('640'),
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
}

describe('<CalendarioIniciativas>', () => {
  afterEach(() => {
    // @ts-expect-error volta ao estado do jsdom (sem matchMedia)
    delete window.matchMedia;
    vi.useRealTimers();
  });

  it('monta o FullCalendar em pt-BR com as visões e o botão Hoje', async () => {
    const onIntervalo = vi.fn();
    render(<CalendarioIniciativas eventos={[]} onIntervalo={onIntervalo} onSelecionar={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mês' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agenda' })).toBeInTheDocument();
    // semana começando no domingo, em português
    expect(screen.getAllByText('dom.').length).toBeGreaterThan(0);
  });

  it('os botões de anterior e próximo têm nome acessível', async () => {
    render(<CalendarioIniciativas eventos={[]} onIntervalo={vi.fn()} onSelecionar={vi.fn()} />);
    await screen.findByRole('button', { name: 'Hoje' });
    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximo/i })).toBeInTheDocument();
  });

  it('avisa o intervalo visível (fim exclusivo, yyyy-MM-dd) ao montar e ao trocar de visão', async () => {
    const onIntervalo = vi.fn();
    render(<CalendarioIniciativas eventos={[]} onIntervalo={onIntervalo} onSelecionar={vi.fn()} />);

    await waitFor(() => expect(onIntervalo).toHaveBeenCalled());
    const primeiro = onIntervalo.mock.calls[0][0] as { de: string; ate: string };
    expect(primeiro.de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // visão de mês: 4 a 6 semanas, de domingo a domingo
    const dias = (Date.parse(primeiro.ate) - Date.parse(primeiro.de)) / 86_400_000;
    expect([28, 35, 42]).toContain(dias);

    onIntervalo.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Dia' }));
    await waitFor(() => expect(onIntervalo).toHaveBeenCalled());
    const dia = onIntervalo.mock.calls.at(-1)![0] as { de: string; ate: string };
    expect((Date.parse(dia.ate) - Date.parse(dia.de)) / 86_400_000).toBe(1);
  });

  it('mostra o evento e chama onSelecionar com a ocorrência ao clicar', async () => {
    const onSelecionar = vi.fn();
    const hoje = new Date();
    const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const evento = ocorrenciaParaEvento({
      ...ocorrencia,
      diaInteiro: true,
      inicio: dia,
      fim: dia,
    });
    render(
      <CalendarioIniciativas eventos={[evento]} onIntervalo={vi.fn()} onSelecionar={onSelecionar} />,
    );

    const item = await screen.findByText('Semana de Boas-Vindas');
    fireEvent.click(item);

    expect(onSelecionar).toHaveBeenCalledTimes(1);
    expect(onSelecionar.mock.calls[0][0]).toMatchObject({ iniciativaId: 'ini-1' });
    expect(onSelecionar.mock.calls[0][1]).toBeInstanceOf(HTMLElement);
  });

  it('em telas de até 640 px começa na Agenda, com a barra de visões no rodapé', async () => {
    definirLargura(true);
    const { container } = render(
      <CalendarioIniciativas eventos={[]} onIntervalo={vi.fn()} onSelecionar={vi.fn()} />,
    );

    expect(await screen.findByText('Nenhuma iniciativa aprovada neste período.')).toBeInTheDocument();
    expect(container.querySelector('.fc-footer-toolbar')).not.toBeNull();
    expect(container.querySelector('.fc-list')).not.toBeNull();
  });

  it('em telas largas começa no Mês, sem rodapé', async () => {
    definirLargura(false);
    const { container } = render(
      <CalendarioIniciativas eventos={[]} onIntervalo={vi.fn()} onSelecionar={vi.fn()} />,
    );

    await screen.findByRole('button', { name: 'Hoje' });
    expect(container.querySelector('.fc-dayGridMonth-view')).not.toBeNull();
    expect(container.querySelector('.fc-footer-toolbar')).toBeNull();
  });
});
