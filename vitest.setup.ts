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
