import { describe, it, expect } from 'vitest';
import { ALL_ROLES, COMITE_ONLY_LINKS, COMITE_ROLES, Links, Roles, linkDetalhe, linkEditar } from './enums';

describe('Roles (nomes no realm do Keycloak)', () => {
  it('mantém o prefixo sys_ e os nomes exatos', () => {
    expect(Roles.USERS).toBe('sys_sistema-de-iniciativas-cin-users');
    expect(Roles.ADMIN).toBe('sys_sistema-de-iniciativas-cin-admin');
    expect(Roles.COMITE).toBe('sys_sistema-de-iniciativas-cin-comite');
  });

  it('são os nomes puros — no back os mesmos valores levam o prefixo realm:', () => {
    for (const role of Object.values(Roles)) {
      expect(role).toMatch(/^sys_sistema-de-iniciativas-cin-/);
    }
  });
});

describe('grupos de roles', () => {
  it('ALL_ROLES aceita qualquer role do sistema', () => {
    expect([...ALL_ROLES].sort()).toEqual([...Object.values(Roles)].sort());
  });

  it('COMITE_ROLES é comitê e administrador (ambos decidem); usuário comum não', () => {
    expect([...COMITE_ROLES].sort()).toEqual([Roles.ADMIN, Roles.COMITE].sort());
    expect(COMITE_ROLES).not.toContain(Roles.USERS);
  });
});

describe('links', () => {
  it('a fila de análise é o único item de menu exclusivo do comitê', () => {
    expect(COMITE_ONLY_LINKS).toEqual([Links.ANALISE]);
  });

  it('monta os caminhos do detalhe e da edição', () => {
    expect(linkDetalhe('abc')).toBe('/iniciativas/abc');
    expect(linkEditar('abc')).toBe('/iniciativas/abc/editar');
  });

  it('as rotas com parâmetro têm o mesmo formato dos helpers', () => {
    expect(Links.DETALHE.replace(':id', 'abc')).toBe(linkDetalhe('abc'));
    expect(Links.EDITAR.replace(':id', 'abc')).toBe(linkEditar('abc'));
  });
});
