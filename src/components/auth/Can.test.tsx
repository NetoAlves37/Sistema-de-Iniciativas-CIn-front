import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from './Can';
import { ALL_ROLES, COMITE_ROLES, Roles } from '../../utils/enums';

// Mock do react-oidc-context: controlamos as roles do "access_token".
const mockUseAuth = vi.fn();
vi.mock('react-oidc-context', () => ({
  useAuth: () => mockUseAuth(),
}));

/** Monta um access_token JWT falso (header.payload.sig) com as roles dadas. */
function fakeToken(roles: string[]): string {
  const payload = btoa(JSON.stringify({ realm_access: { roles } }));
  return `header.${payload}.sig`;
}

function setRoles(roles: string[] | null) {
  mockUseAuth.mockReturnValue({
    user: roles ? { access_token: fakeToken(roles) } : null,
  });
}

describe('<Can>', () => {
  beforeEach(() => mockUseAuth.mockReset());

  it('renderiza os filhos quando o usuário tem a role (comitê + ação do comitê)', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-users', 'sys_sistema-de-iniciativas-cin-comite']);
    render(
      <Can roles={COMITE_ROLES}>
        <button>Decidir</button>
      </Can>,
    );
    expect(screen.queryByText('Decidir')).not.toBeNull();
  });

  it('esconde os filhos quando não tem a role (usuário comum + ação do comitê)', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-users']);
    render(
      <Can roles={COMITE_ROLES}>
        <button>Decidir</button>
      </Can>,
    );
    expect(screen.queryByText('Decidir')).toBeNull();
  });

  it('o administrador da aplicação também vê as ações do comitê (ele decide como o comitê)', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-admin', 'sys_sistema-de-iniciativas-cin-users']);
    render(
      <Can roles={COMITE_ROLES}>
        <button>Decidir</button>
      </Can>,
    );
    expect(screen.queryByText('Decidir')).not.toBeNull();
  });

  it('esconde ação de admin para usuário comum mas mostra para admin', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-users']);
    const { rerender } = render(
      <Can roles={[Roles.ADMIN]}>
        <button>Excluir</button>
      </Can>,
    );
    expect(screen.queryByText('Excluir')).toBeNull();

    setRoles(['sys_sistema-de-iniciativas-cin-admin']);
    rerender(
      <Can roles={[Roles.ADMIN]}>
        <button>Excluir</button>
      </Can>,
    );
    expect(screen.queryByText('Excluir')).not.toBeNull();
  });

  it('mode="disable" desabilita em vez de esconder', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-users']);
    render(
      <Can roles={COMITE_ROLES} mode="disable">
        <button>Decidir</button>
      </Can>,
    );
    expect(screen.getByText('Decidir').hasAttribute('disabled')).toBe(true);
  });

  it('renderiza o fallback quando sem permissão', () => {
    setRoles(['sys_sistema-de-iniciativas-cin-users']);
    render(
      <Can roles={[Roles.ADMIN]} fallback={<span>sem acesso</span>}>
        <button>Config</button>
      </Can>,
    );
    expect(screen.queryByText('sem acesso')).not.toBeNull();
    expect(screen.queryByText('Config')).toBeNull();
  });

  it('usuário sem role reconhecida não vê nada protegido', () => {
    setRoles(['offline_access']);
    render(
      <Can roles={ALL_ROLES}>
        <button>Ver</button>
      </Can>,
    );
    expect(screen.queryByText('Ver')).toBeNull();
  });
});
