# sistema-de-iniciativas-cin-front

Sistema de Iniciativas - CIn — React + Vite + TypeScript. Autenticação via Keycloak (OIDC).

## Requisitos

- Node.js 24.x (`nvm use`)
- Backend rodando (veja [`sistema-de-iniciativas-cin-back`](../sistema-de-iniciativas-cin-back))

## Setup

```bash
cp .env.example .env      # já aponta para http://localhost:3000/sistema-de-iniciativas-cin/api/v1 em dev
npm install
```

> O `.env.example` **não** contém segredos. Para clients confidenciais do Keycloak, defina o segredo apenas no seu `.env` local (que está no gitignore).

## Rodando

```bash
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run preview    # serve o build
npm run lint
npm test           # vitest run
```

## Variáveis de ambiente

Veja [`.env.example`](./.env.example):

- `VITE_API_URL` — URL da API **já com a versão `/v1`** (dev: `http://localhost:3000/sistema-de-iniciativas-cin/api/v1`). Em produção, o `API_URL` do container segue a mesma regra.
- `VITE_KEYCLOAK_JSON` — configuração do client Keycloak.
- `VITE_BASE_URL` — base path público da aplicação.

## Estrutura

```
src/
├── app/             # provedores globais (AppProvider) e composição da aplicação
├── modules/         # um diretório por domínio: api, hooks, types e componentes juntos
│   └── identidade/  # usuário autenticado (GET /me: id, nome e perfil)
├── pages/           # uma pasta por rota (login, inicio, ...)
├── components/      # componentes compartilhados (ErrorBoundary, Can, layout)
├── services/        # cliente HTTP compartilhado (fetchApi, readData, ApiError)
├── hooks/           # hooks compartilhados (useAsync, useAuthorization)
├── lib/             # utils genéricos
├── config/          # env
└── utils/           # auth, navegação, enums de roles
```

O código flui numa direção só: **compartilhado → módulo → app**. Um módulo nunca
importa de outro; a composição acontece em `app/` e `routes.tsx`.

O domínio de iniciativas está sendo implementado por fases (ver `docs/PLANO.md` na raiz do
projeto). Os módulos de exemplo do boilerplate (`todos` e `team`) foram removidos.

### Anatomia de um módulo (`src/modules/identidade/`)

| Arquivo             | Papel                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `*.types.ts`        | Tipos que espelham o contrato HTTP do backend.                          |
| `*.api.ts`          | **Único** lugar que chama `fetchApi` para o módulo; usa `readData`.     |
| `use*.ts`           | Estado do servidor + mutações, sobre `useAsync`.                        |
| `components/`       | Componentes de apresentação, sem acesso à API.                          |

Páginas e componentes não chamam `fetchApi` diretamente: usam os hooks, e os hooks usam o `*.api.ts`.

### Respostas e erros da API

`readData<T>(response, mensagemPadrão)` (`src/services/api.ts`) é o único ponto que conhece o
envelope `{ statusCode, timestamp, path, data }`. Em falha lança `ApiError`, com `status`, `code`
e `fieldErrors` (erros por campo do 422), lidos do Problem Details do backend.

### Controle de acesso: dois níveis

| Onde                        | Como                                              | Exemplo                |
| --------------------------- | ------------------------------------------------ | ---------------------- |
| Página inteira              | `permittedRoles` na rota (`routes.tsx`)          | `/analise` (só comitê) |
| Botão / ação dentro da tela | `<Can roles={[...]}>` (`components/auth/Can.tsx`) | decidir iniciativa     |

Roles (`utils/enums.ts`): `USERS` (acesso padrão), `COMITE` (comitê avaliador) e `ADMIN`
(administrador da aplicação, que **não** decide iniciativas). Itens do menu restritos a certas
roles ficam em `LINK_ROLES`. Tudo isso é só UX: o backend valida a role de novo em cada endpoint.

### Tratamento de erro de renderização

`ErrorBoundary` (`src/components/ErrorBoundary.tsx`) é o boundary padrão. Já
está montado em dois níveis: no `AppProvider` (captura tudo) e por rota em
`routes.tsx` (isola falhas de uma página e se recupera ao navegar). Envolva
qualquer subárvore arriscada com `<ErrorBoundary label="...">`. Ele não pega
erro de evento nem de `async` — para chamadas de API, trate o `error` do
`useAsync`.

## Releases

A pipeline vem de [`cincoders/platform/ci-templates`](https://gitlab.cin.ufpe.br/cincoders/platform/ci-templates), e a aritmética de versão de
[`@cincoders/release-tooling`](https://www.npmjs.com/package/@cincoders/release-tooling). Ambos documentam o fluxo por completo; o que importa aqui:

- A versão exibida no rodapé vem do `package.json`, lida em tempo de build, então
  precisa estar commitada antes de a imagem ser construída.
- Todo merge em `develop` gera um release candidate (`1.4.0-rc.1`, `-rc.2`, ...).
  O merge de `develop` em `main` promove o candidate que chegou lá para a versão
  estável, escreve o `CHANGELOG.md`, cria a tag `vX.Y.Z` e publica a imagem.
- Os commits seguem [Conventional Commits](https://www.conventionalcommits.org). O
  subject vira, literalmente, a entrada do changelog — escreva-os em inglês, assim
  como os comentários de código e a documentação.

Para conferir um cálculo sem alterar nada:

```bash
npm run release:prepare -- --dry-run   # em develop: o próximo candidate
npm run release:promote -- --dry-run   # em main: a versão que seria publicada
```

## Notas

- A aplicação é servida sob um base path (`VITE_BASE_URL`, `/sistema-de-iniciativas-cin` por padrão), injetado no bundle na inicialização do container pelo `docker-entrypoint.sh`.
- `NODE_ENV` não pode estar definido no `.env`: o Vite carrega o `.env` em todos os modos e usa esse valor para decidir `isProduction`, o que transforma o `npm run build` num build de desenvolvimento.
