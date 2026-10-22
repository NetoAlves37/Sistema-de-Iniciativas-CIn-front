import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Smoke test e2e no navegador, contra o ambiente local REAL: Keycloak (docker compose do
 * backend), API NestJS e este front (Vite). Sobe a API e o front sozinho.
 *
 * Pré-requisitos: `docker compose up -d postgres keycloak keycloak-db` no backend e o
 * `.env` do backend configurado (porta do Postgres, Keycloak). Rodar: `npm run e2e`.
 *
 * Os prazos ficam curtos de propósito (≈ 52 s de refinamento e de votação) para as
 * transições aparecerem durante o teste. O banco usado é `BD-SICIN-SMOKE`, recriado a cada
 * execução, então o banco de desenvolvimento não é tocado.
 */
const BACKEND_DIR = process.env.BACKEND_DIR ?? path.resolve(import.meta.dirname, '../backend');
const API_PORT = process.env.E2E_API_PORT ?? '3000';
const FRONT_PORT = process.env.E2E_FRONT_PORT ?? '5173';
export const SMOKE_DATABASE = 'BD-SICIN-SMOKE';

// Usa as variáveis do .env do backend (porta do Postgres, usuário e senha).
try {
  process.loadEnvFile(path.join(BACKEND_DIR, '.env'));
} catch {
  // sem .env: usa o ambiente
}

const baseURL = `http://localhost:${FRONT_PORT}/sistema-de-iniciativas-cin/`;

function urlDoBanco(): string {
  const user = encodeURIComponent(process.env.DB_USERNAME ?? 'postgres');
  const senha = encodeURIComponent(process.env.DB_PASSWORD ?? 'postgres');
  const host = process.env.DB_HOST ?? 'localhost';
  const porta = process.env.DB_PORT ?? '5432';
  return `postgresql://${user}:${senha}@${host}:${porta}/${encodeURIComponent(SMOKE_DATABASE)}`;
}

export default defineConfig({
  testDir: 'e2e',
  timeout: 10 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Recife',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // Compila, recria o banco do smoke test (já migrado) e só então sobe a API.
      command: `npm run build && node scripts/prepare-database.mjs ${SMOKE_DATABASE} --reset && node dist/main`,
      cwd: BACKEND_DIR,
      url: `http://localhost:${API_PORT}/sistema-de-iniciativas-cin/api/health`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        PORT: API_PORT,
        DB_DATABASE: SMOKE_DATABASE,
        DATABASE_URL: urlDoBanco(),
        PRAZO_REFINAMENTO_DIAS: process.env.E2E_PRAZO_DIAS ?? '0.0006',
        PRAZO_VOTACAO_DIAS: process.env.E2E_PRAZO_DIAS ?? '0.0006',
        TRANSICOES_CRON: '*/5 * * * * *',
        CORS_ORIGINS: `http://localhost:${FRONT_PORT}`,
      },
    },
    {
      command: `npm run dev -- --port ${FRONT_PORT} --strictPort`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],
});
