import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import type { TipoIniciativa } from '../../modules/iniciativas/iniciativas.types';
import { pagina, resumos } from '../../modules/iniciativas/iniciativas.fixtures';
import AprovadasPage from './index';

const mockAprovadas = vi.fn();
vi.mock('../../modules/divulgacao/divulgacao.api', () => ({
  divulgacaoApi: {
    aprovadas: (filtro: { q?: string; tipo?: TipoIniciativa; page?: number; limit?: number }) =>
      mockAprovadas(filtro),
  },
}));

const aprovadas = (n: number, inicio = 1) => resumos(n, { status: 'APROVADA' }, inicio);

const renderizar = () =>
  render(
    <MemoryRouter>
      <AprovadasPage />
    </MemoryRouter>,
  );

describe('<AprovadasPage>', () => {
  beforeEach(() => {
    mockAprovadas.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra o cabeçalho, o subtítulo e o botão Ver no calendário', async () => {
    mockAprovadas.mockResolvedValue(pagina(aprovadas(1)));
    renderizar();

    expect(screen.getByRole('heading', { level: 1, name: 'Iniciativas aprovadas' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Todas as iniciativas aprovadas pelo comitê, visíveis a qualquer usuário do sistema.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver no calendário' })).toHaveAttribute(
      'href',
      '/calendario',
    );
    await screen.findByText('Iniciativa 1');
  });

  it('mostra "Carregando…" e depois os cartões, cada um com link para o detalhe', async () => {
    mockAprovadas.mockResolvedValue(pagina(aprovadas(2)));
    renderizar();

    expect(screen.getByText('Carregando…')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: /Iniciativa 2/ });
    expect(link).toHaveAttribute('href', '/iniciativas/ini-2');
    expect(link).toHaveTextContent('10/11/2026 a 20/12/2026, semanal');
    expect(link).toHaveTextContent('Auditório do CIn');
  });

  it('estado vazio', async () => {
    mockAprovadas.mockResolvedValue(pagina([]));
    renderizar();
    expect(
      await screen.findByText('Nenhuma iniciativa aprovada corresponde à busca.'),
    ).toBeInTheDocument();
  });

  it('erro com "Tentar de novo"', async () => {
    mockAprovadas
      .mockRejectedValueOnce(new Error('Não foi possível carregar as iniciativas aprovadas.'))
      .mockResolvedValueOnce(pagina(aprovadas(1)));
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar as iniciativas aprovadas.');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Iniciativa 1')).toBeInTheDocument();
  });

  it('a busca tem rótulo "Buscar", placeholder do protótipo e debounce de 300 ms', async () => {
    mockAprovadas.mockResolvedValue(pagina(aprovadas(1)));
    renderizar();
    await screen.findByText('Iniciativa 1');
    expect(mockAprovadas).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    const campo = screen.getByRole('searchbox', { name: 'Buscar' });
    expect(campo).toHaveAttribute('placeholder', 'Buscar por título, organizador ou espaço');

    fireEvent.change(campo, { target: { value: 'sem' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    fireEvent.change(campo, { target: { value: 'semana' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(mockAprovadas).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mockAprovadas).toHaveBeenCalledTimes(2);
    expect(mockAprovadas).toHaveBeenLastCalledWith({
      q: 'semana',
      tipo: undefined,
      page: 1,
      limit: 12,
    });
  });

  it('o select de tipo começa em "Todos os tipos" e filtra no servidor', async () => {
    mockAprovadas.mockResolvedValue(pagina(aprovadas(1)));
    renderizar();
    await screen.findByText('Iniciativa 1');

    const select = screen.getByRole('combobox', { name: 'Filtrar por tipo' });
    expect(within(select).getByRole('option', { name: 'Todos os tipos' })).toBeInTheDocument();
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Todos os tipos',
      'Extensão',
      'Pesquisa',
      'Evento',
    ]);

    fireEvent.change(select, { target: { value: 'PESQUISA' } });
    await screen.findByText('Iniciativa 1');
    expect(mockAprovadas).toHaveBeenLastCalledWith({
      q: undefined,
      tipo: 'PESQUISA',
      page: 1,
      limit: 12,
    });
  });

  it('"Ver mais" anexa a próxima página', async () => {
    mockAprovadas.mockImplementation(async ({ page }) =>
      page === 2 ? pagina(aprovadas(1, 13), 13, 2, 12) : pagina(aprovadas(12), 13, 1, 12),
    );
    renderizar();
    await screen.findByText('Iniciativa 12');

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    expect(await screen.findByText('Iniciativa 13')).toBeInTheDocument();
    expect(mockAprovadas).toHaveBeenLastCalledWith({
      q: undefined,
      tipo: undefined,
      page: 2,
      limit: 12,
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(13);
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull();
  });

  it('não tem violações de acessibilidade', async () => {
    mockAprovadas.mockResolvedValue(pagina(aprovadas(3)));
    const { container } = renderizar();
    await screen.findByText('Iniciativa 3');
    expect(await axe(container)).toHaveNoViolations();
  });
});
