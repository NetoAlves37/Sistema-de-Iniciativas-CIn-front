import { expect, type Browser, type Page } from '@playwright/test';

/** Datas no fuso do `playwright.config.ts` (America/Recife), em `YYYY-MM-DD`. */
const formatoDia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Recife' });
export const diaRelativo = (dias: number) =>
  formatoDia.format(new Date(Date.now() + dias * 24 * 60 * 60 * 1000));
export const hoje = diaRelativo(0);

/** Abre um contexto isolado e faz login no Keycloak com a senha igual ao usuário. */
export async function entrar(browser: Browser, usuario: string): Promise<Page> {
  const contexto = await browser.newContext();
  const pagina = await contexto.newPage();
  await pagina.goto('');
  await pagina.getByRole('button', { name: /entrar/i }).click();
  await pagina.locator('#username').fill(usuario);
  await pagina.locator('#password').fill(usuario);
  await pagina.locator('#kc-login').click();
  await pagina.waitForURL(/\/inicio/);
  await expect(pagina.getByRole('heading', { name: /Iniciativas da comunidade/i })).toBeVisible();
  return pagina;
}

/** Cadastra um tipo na tela "Tipos de iniciativa" (comitê ou ADMIN). */
export async function cadastrarTipo(pagina: Page, nome: string, cor: string): Promise<void> {
  await pagina.goto('tipos-iniciativa');
  const novo = pagina.getByRole('region', { name: 'Novo tipo' });
  await novo.getByLabel('Nome').fill(nome);
  await novo.getByLabel('Cor em hexadecimal').fill(cor);
  await novo.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(pagina.getByText(`Tipo "${nome}" cadastrado.`).first()).toBeVisible();
}

/**
 * O banco do E2E é recriado a cada execução e uma instalação nova não tem tipos (ADR-024).
 * Garante o tipo pelo nome, entrando como comitê (carla) num contexto próprio.
 */
export async function garantirTipo(browser: Browser, nome: string, cor: string): Promise<void> {
  const carla = await entrar(browser, 'carla');
  await carla.goto('tipos-iniciativa');
  await expect(carla.getByRole('heading', { name: 'Tipos de iniciativa' })).toBeVisible();
  await expect(carla.getByText('Carregando…')).toHaveCount(0);
  const existe = await carla.getByRole('row', { name: new RegExp(`^${nome}\\b`) }).count();
  if (existe === 0) await cadastrarTipo(carla, nome, cor);
  await carla.context().close();
}

export interface DadosSubmissao {
  titulo: string;
  /** Nome do tipo, como aparece no select. */
  tipo: string;
  comVotacao?: boolean;
  dia?: string;
  horaInicio?: string;
  horaFim?: string;
}

/** Submete pelo formulário e devolve o id da iniciativa criada. */
export async function submeter(pagina: Page, dados: DadosSubmissao): Promise<string> {
  await pagina.goto('iniciativas/nova');
  await expect(pagina.getByRole('heading', { name: 'Submeter iniciativa' })).toBeVisible();

  await pagina.locator('#f-tipo').selectOption({ label: dados.tipo });
  await pagina.locator('#f-titulo').fill(dados.titulo);
  await pagina.locator('#f-participantes').fill('30');
  await pagina.locator('#f-resumo').fill('Iniciativa criada pelo E2E no navegador.');
  await pagina.locator('#f-detalhe').fill('Descrição detalhada da iniciativa criada pelo E2E.');
  await pagina.getByLabel('Data de início').fill(dados.dia ?? hoje);
  await pagina.getByLabel('Data de término').fill(dados.dia ?? hoje);
  if (dados.horaInicio) await pagina.getByLabel('Hora de início').fill(dados.horaInicio);
  if (dados.horaFim) await pagina.getByLabel('Hora de término').fill(dados.horaFim);
  await pagina.locator('#f-periodicidade').selectOption('EVENTO_UNICO');
  await pagina.locator('#f-espaco').fill('Auditório do CIn');
  await pagina.locator('#f-organizadores').fill('Ana Souza');
  if (dados.comVotacao === false) await pagina.getByLabel(/Enviar para votação geral/).uncheck();

  await pagina.getByRole('button', { name: 'Submeter iniciativa' }).click();
  await expect(pagina.getByText('Iniciativa submetida e aberta a sugestões').first()).toBeVisible();
  await pagina.waitForURL(/\/iniciativas\/[0-9a-f-]{36}$/);
  return pagina.url().split('/').pop() as string;
}

/** Recarrega o detalhe até aparecer o texto (as transições vêm do job no servidor). */
export async function aguardarNoDetalhe(pagina: Page, id: string, texto: string | RegExp) {
  await expect(async () => {
    await pagina.goto(`iniciativas/${id}`);
    await expect(pagina.getByText(texto).first()).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 150_000, intervals: [3_000] });
}

/** Leva uma iniciativa SEM votação até a aprovação (elisa aprova). */
export async function aprovar(browser: Browser, ana: Page, id: string): Promise<void> {
  await aguardarNoDetalhe(ana, id, 'Aguardando a decisão do comitê avaliador.');
  const elisa = await entrar(browser, 'elisa');
  await elisa.goto(`iniciativas/${id}`);
  await elisa.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await elisa.getByRole('button', { name: 'Confirmar aprovação' }).click();
  await expect(elisa.getByText('Iniciativa aprovada').first()).toBeVisible();
  await elisa.context().close();
}
