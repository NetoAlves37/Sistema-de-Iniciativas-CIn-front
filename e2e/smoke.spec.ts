import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Smoke test do fluxo completo, no navegador, contra Keycloak + API + front reais.
 *
 *  - ana (aluno) submete uma iniciativa COM votação e outra SEM votação;
 *  - bruno (professor) comenta durante o refinamento;
 *  - diego (aluno) vota depois que a votação abre;
 *  - carla (comitê) vê a fila; elisa (comitê) reprova uma e aprova a outra;
 *  - ana ressubmete a reprovada;
 *  - a aprovada aparece em /aprovadas e em /calendario.
 *
 * Usa os prazos curtos do `playwright.config.ts`, então as transições levam cerca de 1 minuto.
 */
const hoje = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Recife' }).format(new Date());
const sufixo = Date.now().toString(36);

const tituloComVotacao = `Hackathon Smoke ${sufixo}`;
const tituloSemVotacao = `Clube de Xadrez Smoke ${sufixo}`;

/** Abre um contexto isolado e faz login no Keycloak com a senha igual ao usuário. */
async function entrar(browser: Browser, usuario: string): Promise<Page> {
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

async function submeter(pagina: Page, titulo: string, comVotacao: boolean): Promise<string> {
  await pagina.goto('iniciativas/nova');
  await expect(pagina.getByRole('heading', { name: 'Submeter iniciativa' })).toBeVisible();

  await pagina.locator('#f-tipo').selectOption('EVENTO');
  await pagina.locator('#f-titulo').fill(titulo);
  await pagina.locator('#f-participantes').fill('30');
  await pagina.locator('#f-resumo').fill('Iniciativa criada pelo smoke test no navegador.');
  await pagina.locator('#f-detalhe').fill('Descrição detalhada da iniciativa criada pelo smoke test.');
  await pagina.getByLabel('Data de início').fill(hoje);
  await pagina.getByLabel('Data de término').fill(hoje);
  await pagina.locator('#f-periodicidade').selectOption('EVENTO_UNICO');
  await pagina.locator('#f-espaco').fill('Auditório do CIn');
  await pagina.locator('#f-organizadores').fill('Ana Souza');

  const checkbox = pagina.getByLabel(/Enviar para votação geral/);
  await expect(checkbox).toBeChecked(); // padrão: marcado
  if (!comVotacao) await checkbox.uncheck();

  await pagina.getByRole('button', { name: 'Submeter iniciativa' }).click();
  await expect(pagina.getByText('Iniciativa submetida e aberta a sugestões').first()).toBeVisible();
  await pagina.waitForURL(/\/iniciativas\/[0-9a-f-]{36}$/);
  await expect(pagina.getByText(titulo).first()).toBeVisible();
  return pagina.url().split('/').pop() as string;
}

/** Recarrega o detalhe até aparecer o texto (as transições vêm do job no servidor). */
async function aguardarNoDetalhe(pagina: Page, id: string, texto: string | RegExp) {
  await expect(async () => {
    await pagina.goto(`iniciativas/${id}`);
    await expect(pagina.getByText(texto).first()).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 150_000, intervals: [3_000] });
}

test.describe.configure({ mode: 'serial' });

test('fluxo completo: submeter, comentar, votar, decidir, ressubmeter e divulgar', async ({ browser }) => {
  // --- ana: login e as duas submissões ---------------------------------------------------
  const ana = await entrar(browser, 'ana');
  await expect(ana.getByText('Iniciativas da comunidade').first()).toBeVisible();
  await expect(ana.getByTestId('usuario-conectado')).toContainText('Ana Souza (Aluno)');

  const idComVotacao = await submeter(ana, tituloComVotacao, true);
  const idSemVotacao = await submeter(ana, tituloSemVotacao, false);

  // detalhe da sem votação: tag e etapa pulada
  await ana.goto(`iniciativas/${idSemVotacao}`);
  await expect(ana.getByText('Sem votação').first()).toBeVisible();
  await expect(ana.getByText('Aberta a sugestões até').first()).toBeVisible();
  // ana é a autora: pode editar, mas não vê o painel de decisão
  await expect(ana.getByRole('link', { name: 'Editar iniciativa' })).toBeVisible();

  // --- bruno comenta durante o refinamento ------------------------------------------------
  const bruno = await entrar(browser, 'bruno');
  await bruno.goto(`iniciativas/${idComVotacao}`);
  await bruno.getByLabel('Sua sugestão').fill('Sugiro incluir um encontro final de apresentação.');
  await bruno.getByRole('button', { name: 'Enviar sugestão' }).click();
  await expect(bruno.getByText('Sugestão enviada').first()).toBeVisible();
  await expect(bruno.getByText('Sugiro incluir um encontro final de apresentação.')).toBeVisible();
  // bruno não é o autor: não pode editar
  await expect(bruno.getByRole('link', { name: 'Editar iniciativa' })).toHaveCount(0);

  // --- fim do refinamento: a votação abre --------------------------------------------------
  await aguardarNoDetalhe(ana, idComVotacao, /Votação aberta até/);

  // --- diego vota like --------------------------------------------------------------------
  const diego = await entrar(browser, 'diego');
  await diego.goto(`iniciativas/${idComVotacao}`);
  const like = diego.getByRole('button', { name: /^Like,/ });
  await expect(like).toBeEnabled();
  await like.click();
  await expect(diego.getByText('Voto registrado').first()).toBeVisible();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveAccessibleName('Like, 1 votos');
  // clicar de novo retira o voto, e votar de novo registra
  await like.click();
  await expect(diego.getByText('Voto retirado').first()).toBeVisible();
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');

  // aluno não acessa a fila do comitê: cai na tela de acesso negado
  await diego.goto('analise');
  await expect(diego.getByText(/You are logged in as/i)).toBeVisible();

  // --- a iniciativa sem votação já está em análise; carla vê a fila ----------------------
  await aguardarNoDetalhe(ana, idSemVotacao, 'Aguardando a decisão do comitê avaliador.');

  const carla = await entrar(browser, 'carla');
  await carla.goto('analise');
  await expect(carla.getByRole('heading', { name: 'Iniciativas em análise' })).toBeVisible();
  const linhaFila = carla.getByRole('link', { name: new RegExp(tituloSemVotacao) });
  await expect(linhaFila).toBeVisible();
  await expect(linhaFila.getByText('Sem votação')).toBeVisible();

  // --- elisa reprova a sem votação, exigindo justificativa --------------------------------
  const elisa = await entrar(browser, 'elisa');
  await elisa.goto(`iniciativas/${idSemVotacao}`);
  await expect(elisa.getByRole('heading', { name: 'Decisão do comitê' })).toBeVisible();
  await elisa.getByRole('button', { name: 'Reprovar' }).click();
  await elisa.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(elisa.getByText('A justificativa é obrigatória para reprovar.').first()).toBeVisible();
  await elisa.getByLabel('Justificativa').fill('Coincide com a semana de provas do calendário.');
  await elisa.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(elisa.getByText('Iniciativa reprovada').first()).toBeVisible();

  // --- ana vê a reprovação e ressubmete ---------------------------------------------------
  await ana.goto(`iniciativas/${idSemVotacao}`);
  await expect(ana.getByText(/Reprovada em/).first()).toBeVisible();
  await expect(ana.getByText('Coincide com a semana de provas do calendário.').first()).toBeVisible();
  await ana.getByRole('link', { name: 'Editar e ressubmeter' }).click();
  await expect(ana.getByRole('heading', { name: 'Editar e ressubmeter' })).toBeVisible();
  await expect(ana.getByText('Justificativa do comitê')).toBeVisible();
  await ana.locator('#f-titulo').fill(`${tituloSemVotacao} (revisado)`);
  await ana.getByRole('button', { name: 'Ressubmeter iniciativa' }).click();
  await expect(ana.getByText('Iniciativa ressubmetida e aberta a sugestões').first()).toBeVisible();
  await expect(ana.getByText('Ciclo 2').first()).toBeVisible();

  // --- fim da votação da primeira: em análise; elisa aprova --------------------------------
  await aguardarNoDetalhe(ana, idComVotacao, 'Aguardando a decisão do comitê avaliador.');
  await carla.goto('analise');
  await expect(carla.getByRole('link', { name: new RegExp(tituloComVotacao) })).toBeVisible();

  // carla também decide (comitê), mas aqui elisa aprova
  await elisa.goto(`iniciativas/${idComVotacao}`);
  await expect(elisa.getByText('1 voto(s)').first()).toBeVisible();
  await elisa.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await elisa.getByRole('button', { name: 'Confirmar aprovação' }).click();
  await expect(elisa.getByText('Iniciativa aprovada').first()).toBeVisible();
  await expect(elisa.getByRole('link', { name: 'Adicionar ao Google Agenda' })).toHaveAttribute(
    'href',
    /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/,
  );

  // --- a aprovada aparece em /aprovadas e em /calendario ---------------------------------
  await diego.goto('aprovadas');
  await diego.getByLabel('Buscar').fill(tituloComVotacao);
  await expect(diego.getByRole('link', { name: new RegExp(tituloComVotacao) })).toBeVisible();
  await expect(diego.getByText('Nenhuma iniciativa aprovada corresponde à busca.')).toHaveCount(0);

  await diego.goto('calendario');
  await expect(diego.getByText(tituloComVotacao).first()).toBeVisible();
  await diego.getByText(tituloComVotacao).first().click();
  const popover = diego.getByRole('dialog');
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('link', { name: 'Adicionar ao Google Agenda' })).toBeVisible();
  await diego.keyboard.press('Escape');
  await expect(popover).toBeHidden();

  // a reprovada/ressubmetida NÃO aparece como aprovada
  await diego.goto('aprovadas');
  await diego.getByLabel('Buscar').fill(tituloSemVotacao);
  await expect(diego.getByText('Nenhuma iniciativa aprovada corresponde à busca.')).toBeVisible();

  // ana vê as duas em "Minhas iniciativas", com os status certos
  await ana.goto('minhas');
  await expect(ana.getByRole('link', { name: new RegExp(tituloComVotacao) })).toBeVisible();
  await expect(ana.getByRole('row', { name: new RegExp(tituloComVotacao) }).getByText('Aprovada', { exact: true })).toBeVisible();
  await expect(ana.getByRole('row', { name: new RegExp(tituloSemVotacao) }).getByText('Em andamento', { exact: true })).toBeVisible();

  // o administrador aparece como "Administrador" (e não como Aluno)
  const admin = await entrar(browser, 'admin');
  await expect(admin.getByTestId('usuario-conectado')).toContainText('Admin Test (Administrador)');
  await expect(admin.getByRole('button', { name: /Open menu|Abrir menu/i }).first()).toBeVisible();

  // o link de privacidade está no rodapé
  await expect(ana.getByRole('link', { name: 'Privacidade' }).first()).toBeVisible();
});
