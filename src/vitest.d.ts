// Torna os matchers do @testing-library/jest-dom (toBeInTheDocument, etc.)
// visíveis para o TypeScript nos testes. Em runtime, são registrados por
// vitest.setup.ts; aqui apenas trazemos a augmentação de tipos.
import "@testing-library/jest-dom/vitest";

// Tipos do matcher `toHaveNoViolations` (vitest-axe).
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
