import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { pagina, resumo, resumos } from '../../modules/iniciativas/iniciativas.fixtures';
import type { FiltroIniciativas } from '../../modules/iniciativas/iniciativas.types';
import InicioPage from './index';

const mockListar = vi.fn();
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: { listar: (filtro: FiltroIniciativas) => mockListar(filtro) },
}));

const mockMe = vi.fn();
vi.mock('../../modules/identidade/MeProvider', () => ({ useMe: () => mockMe() }));

const semUsuario = { me: undefined, isLoading: false, error: null, reload: vi.fn() };
const comUsuario = (nome: string, perfil: string) => ({
  ...semUsuario,
  me: { id: 'u', nome, perfil, ehComite: false, prazos: { refinamentoDias: 3, votacaoDias: 3 } },
});

const emDois = () => new Date(Date.now() + 2 * 86_400_000 + 90 * 60_000).toISOString();

const votacao = (n: number, inicio = 1) =>
  resumos(n, { status: 'EM_VOTACAO', prazoAtual: emDois() }, inicio);
const andamento = (n: number, inicio = 100) =>
  resumos(
    n,
    { status: 'EM_ANDAMENTO', prazoAtual: emDois(), sugestoesCicloAtual: 4, votos: { likes: 0, dislikes: 0, relevancia: 0 } },
    inicio,
  );

/** Responde por status: as duas seções chamam a mesma API com filtros diferentes. */
function responder(porStatus: Record<string, () => unknown>) {
  mockListar.mockImplementation(async (filtro: FiltroIniciativas) => {
    const resposta = porStatus[filtro.status ?? '']?.();
    if (resposta instanceof Error) throw resposta;
    return resposta;
  });
}

const renderizar = () =>
  render(
    <MemoryRouter>
      <InicioPage />
    </MemoryRouter>,
  );

describe('<InicioPage>', () => {
  beforeEach(() => {
    mockListar.mockReset();
    mockMe.mockReturnValue(semUsuario);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['Ana Souza', 'ALUNO', 'Aluno'],
    ['Bruno Lima', 'PROFESSOR', 'Professor'],
    ['Carla Menezes', 'COMITE', 'Comitê avaliador'],
    ['Admin Test', 'ADMIN', 'Administrador'],
  ])('mostra quem está conectado: %s (%s) como "%s"', async (nome, perfil, rotulo) => {
    mockMe.mockReturnValue(comUsuario(nome, perfil));
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();

    expect(screen.getByTestId('usuario-conectado')).toHaveTextContent(`Conectado como ${nome} (${rotulo})`);
  });

  it('não mostra a linha do usuário enquanto o perfil não carregou', async () => {
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();
    expect(screen.queryByTestId('usuario-conectado')).toBeNull();
  });

  it('mostra o cabeçalho, o subtítulo e o botão Submeter iniciativa', async () => {
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();

    expect(screen.getByRole('heading', { level: 1, name: 'Iniciativas da comunidade' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sugira melhorias nas iniciativas em andamento e vote nas que estão em votação. Os votos mostram o interesse do público e não decidem a aprovação.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submeter iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/nova',
    );
    await waitFor(() => expect(mockListar).toHaveBeenCalledTimes(2));
  });

  it('mostra "Carregando…" enquanto as listas não chegam', async () => {
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();
    expect(screen.getAllByText('Carregando…')).toHaveLength(2);
    expect(await screen.findByText('Nenhuma iniciativa em votação agora.')).toBeInTheDocument();
  });

  it('mostra os estados vazios das duas seções', async () => {
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();

    expect(await screen.findByText('Nenhuma iniciativa em votação agora.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma iniciativa recebendo sugestões agora.')).toBeInTheDocument();
  });

  it('pede cada seção ao servidor, com status, ordem e 10 itens por página', async () => {
    responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
    renderizar();
    await waitFor(() => expect(mockListar).toHaveBeenCalledTimes(2));

    expect(mockListar).toHaveBeenCalledWith({
      status: 'EM_VOTACAO',
      ordenar: 'relevancia',
      page: 1,
      limit: 10,
    });
    expect(mockListar).toHaveBeenCalledWith({
      status: 'EM_ANDAMENTO',
      ordenar: 'prazo',
      page: 1,
      limit: 10,
    });
  });

  it('em votação: ranking, tipo, autor, resumo, mini-votos e "Encerra em"', async () => {
    responder({
      EM_VOTACAO: () => pagina(votacao(2)),
      EM_ANDAMENTO: () => pagina([]),
    });
    renderizar();

    const secao = await screen.findByRole('region', { name: 'Em votação' });
    expect(within(secao).getByText('Ordenadas por relevância')).toBeInTheDocument();
    const linhas = within(secao).getAllByRole('link');
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent('1º');
    expect(linhas[1]).toHaveTextContent('2º');
    expect(linhas[0]).toHaveTextContent('Iniciativa 1');
    expect(linhas[0]).toHaveTextContent('Evento');
    expect(linhas[0]).toHaveTextContent('Bruno Lima');
    expect(linhas[0]).toHaveTextContent('Recepção dos calouros.');
    expect(linhas[0]).toHaveTextContent('Likes:18');
    expect(linhas[0]).toHaveTextContent('Dislikes:2');
    expect(linhas[0]).toHaveTextContent('Encerra em 2d 1h');
    expect(linhas[0]).toHaveAttribute('href', '/iniciativas/ini-1');
  });

  it('em andamento: "N sugestões" e "Sugestões até <prazo>", sem ranking', async () => {
    responder({
      EM_VOTACAO: () => pagina([]),
      EM_ANDAMENTO: () => pagina(andamento(1)),
    });
    renderizar();

    const secao = await screen.findByRole('region', { name: 'Em andamento: abertas a sugestões' });
    expect(within(secao).getByText('Ordenadas pelo prazo mais próximo')).toBeInTheDocument();
    const linha = await within(secao).findByRole('link');
    expect(linha).toHaveTextContent('4 sugestões');
    expect(linha).toHaveTextContent('Sugestões até 2d 1h');
    expect(linha).not.toHaveTextContent('1º');
  });

  it('mostra o erro de uma seção com "Tentar de novo", sem derrubar a outra', async () => {
    let falhar = true;
    responder({
      EM_VOTACAO: () => (falhar ? new Error('Não foi possível carregar as iniciativas.') : pagina(votacao(1))),
      EM_ANDAMENTO: () => pagina(andamento(1)),
    });
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar as iniciativas.');
    expect(await screen.findByText('Iniciativa 100')).toBeInTheDocument();

    falhar = false;
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Iniciativa 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('"Ver mais" aparece só quando há mais itens e anexa a próxima página', async () => {
    mockListar.mockImplementation(async (filtro: FiltroIniciativas) => {
      if (filtro.status === 'EM_ANDAMENTO') return pagina([]);
      return filtro.page === 2
        ? pagina(votacao(2, 11), 12, 2, 10)
        : pagina(votacao(10), 12, 1, 10);
    });
    renderizar();

    const secao = await screen.findByRole('region', { name: 'Em votação' });
    await within(secao).findByText('Iniciativa 10');
    expect(within(secao).getAllByRole('link')).toHaveLength(10);

    fireEvent.click(within(secao).getByRole('button', { name: 'Ver mais' }));
    await within(secao).findByText('Iniciativa 12');

    expect(mockListar).toHaveBeenCalledWith({
      status: 'EM_VOTACAO',
      ordenar: 'relevancia',
      page: 2,
      limit: 10,
    });
    expect(within(secao).getAllByRole('link')).toHaveLength(12);
    expect(within(secao).getByText('11º')).toBeInTheDocument();
    expect(within(secao).queryByRole('button', { name: 'Ver mais' })).toBeNull();
  });

  it('sem "Ver mais" quando tudo coube na primeira página', async () => {
    responder({ EM_VOTACAO: () => pagina(votacao(3)), EM_ANDAMENTO: () => pagina([]) });
    renderizar();
    await screen.findByText('Iniciativa 3');
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull();
  });

  describe('recarga automática', () => {
    it('recarrega as duas listas a cada 60 s', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      responder({ EM_VOTACAO: () => pagina(votacao(1)), EM_ANDAMENTO: () => pagina([]) });
      renderizar();
      await screen.findByText('Iniciativa 1');
      expect(mockListar).toHaveBeenCalledTimes(2);

      responder({
        EM_VOTACAO: () => pagina([resumo({ id: 'novo', titulo: 'Chegou agora', prazoAtual: emDois() })]),
        EM_ANDAMENTO: () => pagina([]),
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(mockListar).toHaveBeenCalledTimes(4);
      expect(await screen.findByText('Chegou agora')).toBeInTheDocument();
    });

    it('espera enquanto algum campo tem o foco', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      responder({ EM_VOTACAO: () => pagina([]), EM_ANDAMENTO: () => pagina([]) });
      const campo = document.createElement('input');
      document.body.appendChild(campo);
      campo.focus();
      renderizar();
      await screen.findByText('Nenhuma iniciativa em votação agora.');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(180_000);
      });
      expect(mockListar).toHaveBeenCalledTimes(2);
      campo.remove();
    });
  });

  it('não tem violações de acessibilidade', async () => {
    responder({ EM_VOTACAO: () => pagina(votacao(2)), EM_ANDAMENTO: () => pagina(andamento(2)) });
    const { container } = renderizar();
    await screen.findByText('Iniciativa 101');
    expect(await axe(container)).toHaveNoViolations();
  });
});
