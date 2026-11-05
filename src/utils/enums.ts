export enum Links {
  ACCOUNT_MANAGEMENT = 'https://account.cin.ufpe.br',
  INTRANET_HOME = 'https://intranet.cin.ufpe.br/',
  HOME = '/',
  FORBIDDEN = '/forbidden',
  INICIO = '/inicio',
  SUBMETER = '/iniciativas/nova',
  DETALHE = '/iniciativas/:id',
  EDITAR = '/iniciativas/:id/editar',
  MINHAS = '/minhas',
  APROVADAS = '/aprovadas',
  CALENDARIO = '/calendario',
  ANALISE = '/analise',
  PRIVACIDADE = '/privacidade',
}

/** Monta o caminho do detalhe de uma iniciativa. */
export const linkDetalhe = (id: string) => `/iniciativas/${id}`;
/** Monta o caminho da edição (ou ressubmissão) de uma iniciativa. */
export const linkEditar = (id: string) => `/iniciativas/${id}/editar`;

/**
 * Roles do sistema no realm do Keycloak — fonte única do modelo.
 *
 * - `USERS`: acesso padrão (aluno ou professor).
 * - `COMITE`: comitê avaliador (fila de análise e decisão).
 * - `ADMIN`: administrador da aplicação. Participa como usuário comum e também decide,
 *   com as mesmas regras do comitê (inclusive o conflito de interesse).
 *
 * O perfil de exibição (Aluno, Professor, Comitê, Administrador) vem do backend em `GET /me`.
 */
export enum Roles {
  USERS = 'sys_sistema-de-iniciativas-cin-users',
  COMITE = 'sys_sistema-de-iniciativas-cin-comite',
  ADMIN = 'sys_sistema-de-iniciativas-cin-admin',
}

/**
 * Rotas de acesso geral: qualquer usuário autenticado do sistema. Todas as roles entram
 * explícitas para não depender de composite role no Keycloak — o match do `RequireAuth`
 * é "tem ao menos uma destas".
 */
export const ALL_ROLES: Roles[] = [Roles.USERS, Roles.COMITE, Roles.ADMIN];

/** Quem acessa a fila de análise e decide: comitê e administrador. */
export const COMITE_ROLES: Roles[] = [Roles.COMITE, Roles.ADMIN];

/**
 * Itens do menu restritos ao comitê. O link some do menu de quem não é do comitê; a
 * restrição de verdade é o `permittedRoles` da rota em `routes.tsx` e, acima de tudo, o
 * backend.
 */
export const COMITE_ONLY_LINKS: string[] = [Links.ANALISE];
