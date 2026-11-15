import '@testing-library/jest-dom/vitest'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// vitest-axe: `expect(await axe(container)).toHaveNoViolations()` nos testes de página.
import * as axeMatchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(axeMatchers);

// Tipos de iniciativa: são um cadastro carregado do backend. Os testes partem dos três tipos
// de antes (Extensão, Pesquisa, Evento) já carregados, sem chamar a API.
import { beforeEach } from 'vitest';
import { semearTipos } from './src/modules/iniciativas/useTipos';
import { TIPOS_DE_TESTE } from './src/modules/iniciativas/tipos.fixtures';

beforeEach(() => {
  semearTipos(TIPOS_DE_TESTE);
});
