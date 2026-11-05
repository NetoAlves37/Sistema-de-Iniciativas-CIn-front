import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteMap from './routes';
import type { AuthContextProps } from 'react-oidc-context';

const mockUseAuth = vi.fn();
vi.mock('react-oidc-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Evita chamadas de rede nos testes de rota: o perfil vem de GET /me.
const mockGetMe = vi.fn();
vi.mock('./modules/identidade/me.api', () => ({
  meApi: { getMe: () => mockGetMe() },
}));

// As páginas buscam listas: aqui só importa a navegação, então as APIs respondem vazio.
const paginaVazia = { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } };
vi.mock('./modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: {
    listar: () => Promise.resolve(paginaVazia),
    listarMinhas: () =>
      Promise.resolve({ ...paginaVazia, meta: { ...paginaVazia.meta, contagemPorStatus: {} } }),
  },
}));
vi.mock('./modules/avaliacao/avaliacao.api', () => ({
  avaliacaoApi: { fila: () => Promise.resolve(paginaVazia) },
}));
vi.mock('./modules/divulgacao/divulgacao.api', () => ({
  divulgacaoApi: {
    aprovadas: () => Promise.resolve(paginaVazia),
    ocorrencias: () => Promise.resolve([]),
  },
}));

/** Monta um access_token JWT falso com roles */
function fakeToken(roles: string[]): string {
  const payload = btoa(JSON.stringify({ realm_access: { roles } }));
  return `header.${payload}.sig`;
}

describe('<RouteMap>', () => {
  let mockSigninRedirect: ReturnType<typeof vi.fn>;
  let mockEvents: {
    addAccessTokenExpired: ReturnType<typeof vi.fn>;
    removeAccessTokenExpired: ReturnType<typeof vi.fn>;
    addSilentRenewError: ReturnType<typeof vi.fn>;
    removeSilentRenewError: ReturnType<typeof vi.fn>;
    addUserSignedOut: ReturnType<typeof vi.fn>;
    removeUserSignedOut: ReturnType<typeof vi.fn>;
  };

  const unauthenticated = () =>
    ({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      user: null,
      signinRedirect: mockSigninRedirect,
      events: mockEvents,
    }) as unknown as AuthContextProps;

  const authenticated = (roles: string[]) =>
    ({
      isAuthenticated: true,
      isLoading: false,
      activeNavigator: undefined,
      user: {
        access_token: fakeToken(roles),
        profile: { email: 'user@cin.ufpe.br' },
      },
      signinRedirect: mockSigninRedirect,
      signinSilent: vi.fn().mockResolvedValue(null),
      events: mockEvents,
    }) as unknown as AuthContextProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSigninRedirect = vi.fn();
    mockGetMe.mockResolvedValue({
      id: 'u1',
      nome: 'Ana Souza',
      perfil: 'ALUNO',
      ehComite: false,
      prazos: { refinamentoDias: 3, votacaoDias: 3 },
    });
    mockEvents = {
      addAccessTokenExpired: vi.fn(),
      removeAccessTokenExpired: vi.fn(),
      addSilentRenewError: vi.fn(),
      removeSilentRenewError: vi.fn(),
      addUserSignedOut: vi.fn(),
      removeUserSignedOut: vi.fn(),
    };
    window.history.pushState({}, 'Test', '/');
  });

  it('renderiza a tela de login na rota / quando o usuário NÃO está autenticado e não redireciona', () => {
    mockUseAuth.mockReturnValue(unauthenticated());

    render(<RouteMap />);

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(mockSigninRedirect).not.toHaveBeenCalled();
  });

  it('redireciona para /inicio, mostra as duas listas e carrega o perfil (GET /me)', async () => {
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    expect(await screen.findByText(/Iniciativas da comunidade/i)).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma iniciativa em votação agora.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma iniciativa recebendo sugestões agora.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^entrar$/i })).toBeNull();
    expect(window.location.pathname).toBe('/inicio');
    expect(mockGetMe).toHaveBeenCalledTimes(1);
    expect(mockSigninRedirect).not.toHaveBeenCalled();
  });

  it('o comitê acessa /analise e vê a fila', async () => {
    window.history.pushState({}, 'Test', '/analise');
    mockUseAuth.mockReturnValue(
      authenticated([
        'sys_sistema-de-iniciativas-cin-users',
        'sys_sistema-de-iniciativas-cin-comite',
      ]),
    );

    render(<RouteMap />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /Iniciativas em análise/ }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma iniciativa aguardando decisão.')).toBeInTheDocument();
  });

  it('quem não é do comitê recebe a página de acesso negado em /analise', async () => {
    window.history.pushState({}, 'Test', '/analise');
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    expect(await screen.findByText(/You are logged in as/i)).toBeInTheDocument();
    expect(screen.queryByText(/Iniciativas em análise/)).toBeNull();
  });

  it('as telas protegidas têm o link Privacidade no rodapé', async () => {
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    await screen.findByText(/Iniciativas da comunidade/i);
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });

  it('/privacidade mostra o aviso de privacidade', async () => {
    window.history.pushState({}, 'Test', '/privacidade');
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/Quais dados o sistema usa/)).toBeInTheDocument();
  });

  it('/minhas, /aprovadas e /calendario abrem para qualquer usuário do sistema', async () => {
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    for (const [caminho, titulo] of [
      ['/minhas', 'Minhas iniciativas'],
      ['/aprovadas', 'Iniciativas aprovadas'],
      ['/calendario', 'Calendário'],
    ] as const) {
      window.history.pushState({}, 'Test', caminho);
      const { unmount } = render(<RouteMap />);
      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
      unmount();
    }
  });

  it('o administrador da aplicação também acessa o início', async () => {
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-admin']));

    render(<RouteMap />);

    expect(await screen.findByText(/Iniciativas da comunidade/i)).toBeInTheDocument();
  });

  it('uma falha em GET /me não impede de usar o início', async () => {
    mockGetMe.mockRejectedValue(new Error('Serviço indisponível.'));
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    expect(await screen.findByText(/Iniciativas da comunidade/i)).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma iniciativa em votação agora.')).toBeInTheDocument();
  });

  it('chama signinRedirect ao clicar no botão Entrar na tela de login', () => {
    mockUseAuth.mockReturnValue(unauthenticated());

    render(<RouteMap />);

    screen.getByRole('button', { name: /entrar/i }).click();

    expect(mockSigninRedirect).toHaveBeenCalledTimes(1);
  });

  it('bloqueia /inicio para usuário autenticado sem nenhuma role do sistema (ForbiddenPage)', async () => {
    window.history.pushState({}, 'Test', '/inicio');
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-editor']));

    render(<RouteMap />);

    expect(await screen.findByText(/You are logged in as/i)).toBeInTheDocument();
    expect(screen.queryByText(/Iniciativas da comunidade/i)).toBeNull();
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it('redireciona para / e exibe a tela de login quando não autenticado tenta acessar /inicio', () => {
    window.history.pushState({}, 'Test', '/inicio');
    mockUseAuth.mockReturnValue(unauthenticated());

    render(<RouteMap />);

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(mockSigninRedirect).not.toHaveBeenCalled();
  });

  it('as rotas do boilerplate removidas (/todos, /team) caem no 404', async () => {
    window.history.pushState({}, 'Test', '/todos');
    mockUseAuth.mockReturnValue(authenticated(['sys_sistema-de-iniciativas-cin-users']));

    render(<RouteMap />);

    expect(await screen.findByRole('img', { name: /erro 404/i })).toBeInTheDocument();
    expect(screen.queryByText(/Tarefas/i)).toBeNull();
  });
});
