import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { pagina, resumo } from '../../modules/iniciativas/iniciativas.fixtures';
import AnalisePage from './index';

const mockFila = vi.fn();
vi.mock('../../modules/avaliacao/avaliacao.api', () => ({
  avaliacaoApi: { fila: (filtro: { page?: number; limit?: number }) => mockFila(filtro) },
}));

const item = (sobrescrever: Parameters<typeof resumo>[0] & { souAutor?: boolean }) => {
  const { souAutor = false, ...resto } = sobrescrever;
  return { ...resumo({ status: 'EM_ANALISE', prazoAtual: null, ...resto }), souAutor };
};

const renderizar = () =>
  render(
    <MemoryRouter>
      <AnalisePage />
    </MemoryRouter>,
  );

describe('<AnalisePage>', () => {
  beforeEach(() => {
    mockFila.mockReset();
  });

  it('mostra o título e o subtítulo do protótipo', async () => {
    mockFila.mockResolvedValue(pagina([]));
    renderizar();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Iniciativas em análise');
    expect(
      screen.getByText(
        'Ordenadas por relevância na votação da comunidade. Os votos são só uma referência para a reunião do comitê.',
      ),
    ).toBeInTheDocument();
    await screen.findByText('Nenhuma iniciativa aguardando decisão.');
  });

  it('mostra "Carregando…" e depois o estado vazio', async () => {
    mockFila.mockResolvedValue(pagina([]));
    renderizar();
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma iniciativa aguardando decisão.')).toBeInTheDocument();
  });

  it('lista com ranking, mini-votos e a tag "Você é o autor" só nas próprias', async () => {
    mockFila.mockResolvedValue(
      pagina([
        item({ id: 'a', titulo: 'Primeira', votos: { likes: 30, dislikes: 1, relevancia: 0.9 } }),
        item({ id: 'b', titulo: 'Segunda', souAutor: true }),
      ]),
    );
    renderizar();

    const links = await screen.findAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('1º');
    expect(links[0]).toHaveTextContent('Primeira');
    expect(links[0]).toHaveTextContent('Likes:30');
    expect(links[0]).toHaveTextContent('Dislikes:1');
    expect(links[0]).not.toHaveTextContent('Você é o autor');
    expect(links[1]).toHaveTextContent('2º');
    expect(within(links[1]).getByText('Você é o autor')).toBeInTheDocument();
    expect(links[0]).toHaveAttribute('href', '/iniciativas/a');
  });

  it('mostra a tag "Sem votação" quando a iniciativa não teve votação', async () => {
    mockFila.mockResolvedValue(
      pagina([
        item({
          id: 'a',
          titulo: 'Direto ao comitê',
          comVotacao: false,
          votos: { likes: 0, dislikes: 0, relevancia: 0 },
        }),
        item({ id: 'b', titulo: 'Com votação' }),
      ]),
    );
    renderizar();

    const [semVotacao, comVotacao] = await screen.findAllByRole('link');
    expect(within(semVotacao).getByText('Sem votação')).toBeInTheDocument();
    expect(within(comVotacao).queryByText('Sem votação')).toBeNull();
  });

  it('mostra quantas aguardam decisão no título', async () => {
    mockFila.mockResolvedValue(pagina([item({ id: 'a' })], 7));
    renderizar();
    await screen.findByRole('link');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Aguardando decisão: 7');
  });

  it('"Ver mais" pede a próxima página da fila', async () => {
    mockFila.mockImplementation(async ({ page }) =>
      page === 2
        ? pagina([item({ id: 'z', titulo: 'Da segunda página' })], 21, 2, 20)
        : pagina(
            Array.from({ length: 20 }, (_, i) => item({ id: `i${i}`, titulo: `Item ${i}` })),
            21,
            1,
            20,
          ),
    );
    renderizar();
    await screen.findByText('Item 19');
    expect(mockFila).toHaveBeenCalledWith({ page: 1, limit: 20 });

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }));
    expect(await screen.findByText('Da segunda página')).toBeInTheDocument();
    expect(mockFila).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    expect(screen.getAllByRole('link')).toHaveLength(21);
  });

  it('erro com "Tentar de novo"', async () => {
    mockFila
      .mockRejectedValueOnce(new Error('Não foi possível carregar a fila de análise.'))
      .mockResolvedValueOnce(pagina([item({ id: 'a', titulo: 'Voltou' })]));
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar a fila de análise.');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Voltou')).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    mockFila.mockResolvedValue(
      pagina([item({ id: 'a', titulo: 'Primeira', souAutor: true }), item({ id: 'b' })]),
    );
    const { container } = renderizar();
    await screen.findByText('Primeira');
    expect(await axe(container)).toHaveNoViolations();
  });
});
