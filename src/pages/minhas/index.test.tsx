import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { pagina, resumo } from '../../modules/iniciativas/iniciativas.fixtures';
import type { StatusIniciativa } from '../../modules/iniciativas/iniciativas.types';
import MinhasPage from './index';

const mockListarMinhas = vi.fn();
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: {
    listarMinhas: (filtro: { status?: StatusIniciativa; page?: number; limit?: number }) =>
      mockListarMinhas(filtro),
  },
}));

const CONTAGEM = { EM_ANDAMENTO: 1, EM_VOTACAO: 1, EM_ANALISE: 1, APROVADA: 1, REPROVADA: 1 };

const todas = [
  resumo({
    id: 'a',
    titulo: 'Em sugestões',
    status: 'EM_ANDAMENTO',
    fimRefinamento: '2026-10-25T15:30:00',
  }),
  resumo({ id: 'b', titulo: 'Em votação X', status: 'EM_VOTACAO', fimVotacao: '2026-10-28T09:05:00' }),
  resumo({ id: 'c', titulo: 'Com o comitê', status: 'EM_ANALISE' }),
  resumo({
    id: 'd',
    titulo: 'Já aprovada',
    status: 'APROVADA',
    decididaEm: '2026-10-30T18:00:00',
  }),
  resumo({ id: 'e', titulo: 'Foi reprovada', status: 'REPROVADA' }),
];

function respostaMinhas(items = todas, contagem: Record<string, number> = CONTAGEM, total = items.length) {
  const base = pagina(items, total);
  return { ...base, meta: { ...base.meta, contagemPorStatus: contagem } };
}

const renderizar = () =>
  render(
    <MemoryRouter>
      <MinhasPage />
    </MemoryRouter>,
  );

describe('<MinhasPage>', () => {
  beforeEach(() => {
    mockListarMinhas.mockReset();
  });

  it('mostra o esqueleto da tabela enquanto carrega', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas());
    const { container } = renderizar();

    expect(screen.getByRole('heading', { level: 1, name: 'Minhas iniciativas' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"], .animate-pulse')).not.toBeNull();
    await screen.findByText('Em sugestões');
  });

  it('mostra o cabeçalho, o subtítulo e o botão Submeter iniciativa', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas());
    renderizar();

    expect(
      screen.getByText('Acompanhe o status de cada iniciativa que você propôs.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submeter iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/nova',
    );
    await screen.findByText('Em sugestões');
  });

  it('lista as colunas, o título como link e o próximo passo de cada status', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas());
    renderizar();

    await screen.findByText('Em sugestões');
    for (const coluna of ['Iniciativa', 'Tipo', 'Status', 'Próximo passo', 'Votos']) {
      expect(screen.getByRole('columnheader', { name: coluna })).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: 'Em sugestões' })).toHaveAttribute(
      'href',
      '/iniciativas/a',
    );
    expect(screen.getByText('Sugestões até 25/10/2026 15:30')).toBeInTheDocument();
    expect(screen.getByText('Votação até 28/10/2026 09:05')).toBeInTheDocument();
    expect(screen.getByText('Aguardando o comitê')).toBeInTheDocument();
    expect(screen.getByText('Aprovada em 30/10/2026 18:00')).toBeInTheDocument();
    expect(screen.getByText('Pode editar e ressubmeter')).toBeInTheDocument();
  });

  it('mostra "Editar" só em Em andamento e Reprovada', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas());
    renderizar();
    await screen.findByText('Em sugestões');

    const editar = screen.getAllByRole('link', { name: /^Editar / });
    expect(editar.map((l) => l.getAttribute('href'))).toEqual([
      '/iniciativas/a/editar',
      '/iniciativas/e/editar',
    ]);
    const linhaVotacao = screen.getByText('Em votação X').closest('tr')!;
    expect(within(linhaVotacao).queryByText('Editar')).toBeNull();
  });

  it('chips: "Todas (N)" e um por status com contagem, com aria-pressed', async () => {
    mockListarMinhas.mockResolvedValue(
      respostaMinhas(todas, { EM_ANDAMENTO: 2, APROVADA: 1 }),
    );
    renderizar();
    await screen.findByText('Em sugestões');

    const grupo = screen.getByRole('group', { name: 'Filtrar por status' });
    const chips = within(grupo).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual([
      'Todas (3)',
      'Em andamento (2)',
      'Aprovada (1)',
    ]);
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(chips[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('o filtro vai para o servidor e o chip marcado muda', async () => {
    mockListarMinhas.mockImplementation(async ({ status }) =>
      status === 'APROVADA'
        ? respostaMinhas([todas[3]], CONTAGEM, 1)
        : respostaMinhas(),
    );
    renderizar();
    await screen.findByText('Em sugestões');
    expect(mockListarMinhas).toHaveBeenLastCalledWith({ status: undefined, page: 1, limit: 20 });

    fireEvent.click(screen.getByRole('button', { name: 'Aprovada (1)' }));

    await waitFor(() => expect(screen.queryByText('Em sugestões')).toBeNull());
    expect(mockListarMinhas).toHaveBeenLastCalledWith({ status: 'APROVADA', page: 1, limit: 20 });
    expect(screen.getByText('Já aprovada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovada (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todas (5)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Todas (5)' }));
    expect(await screen.findByText('Em sugestões')).toBeInTheDocument();
  });

  it('paginação no servidor: "Ver mais" pede a próxima página', async () => {
    mockListarMinhas.mockImplementation(async ({ page }) =>
      page === 2
        ? respostaMinhas([resumo({ id: 'z', titulo: 'Segunda página', status: 'APROVADA' })], CONTAGEM, 6)
        : respostaMinhas(todas, CONTAGEM, 6),
    );
    renderizar();
    await screen.findByText('Em sugestões');

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    expect(await screen.findByText('Segunda página')).toBeInTheDocument();
    expect(mockListarMinhas).toHaveBeenLastCalledWith({ status: undefined, page: 2, limit: 20 });
    expect(screen.getByText('Em sugestões')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull();
  });

  it('estado vazio: quem nunca submeteu vê a mensagem e o botão', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas([], {}, 0));
    renderizar();

    expect(await screen.findByText('Você ainda não submeteu nenhuma iniciativa.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submeter iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/nova',
    );
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('mostra o erro na tabela e permite tentar de novo', async () => {
    mockListarMinhas
      .mockRejectedValueOnce(new Error('Não foi possível carregar as suas iniciativas.'))
      .mockResolvedValueOnce(respostaMinhas());
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar as suas iniciativas.');

    fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Em sugestões')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('não tem violações de acessibilidade', async () => {
    mockListarMinhas.mockResolvedValue(respostaMinhas());
    const { container } = renderizar();
    await screen.findByText('Em sugestões');
    expect(await axe(container)).toHaveNoViolations();
  });
});
