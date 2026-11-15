import { expect, test, type Page } from '@playwright/test';
import {
  aprovar,
  cadastrarTipo,
  diaRelativo,
  entrar,
  garantirTipo,
  hoje,
  submeter,
} from './apoio';

/**
 * E2E no navegador das duas features de 15/11/2026, contra Keycloak + API + front reais:
 *
 *  1. Cadastro de tipos de iniciativa (ADR-024): comitê cadastra, edita, desativa e exclui;
 *     aluno não acessa; o tipo aparece (ou some) no formulário de submissão; tipo em uso não
 *     pode ser excluído.
 *  2. Alteração de datas pelo calendário (ADR-023): comitê altera pelo popover e o calendário
 *     mostra o novo horário; aluno não vê a opção; arrastar abre o diálogo com a proposta e
 *     só grava ao salvar.
 */
test.describe.configure({ mode: 'serial' });

const sufixo = Date.now().toString(36);

/** Linha da tabela de tipos cujo cabeçalho (a etiqueta) é o nome. */
const linhaDoTipo = (pagina: Page, nome: string) =>
  pagina.getByRole('row', { name: new RegExp(`^${nome}\\b`) });

test('cadastro de tipos: cadastrar, usar, editar, desativar e excluir', async ({ browser }) => {
  const nomePalestra = `Palestra ${sufixo}`;
  const codigo = `PALESTRA_${sufixo.toUpperCase()}`;

  // --- carla (comitê) cadastra -------------------------------------------------------------
  const carla = await entrar(browser, 'carla');
  await cadastrarTipo(carla, nomePalestra, '#1E3A8A');
  const linha = linhaDoTipo(carla, nomePalestra);
  await expect(linha).toContainText(codigo);
  await expect(linha).toContainText('Ativo');
  await expect(linha.getByRole('cell', { name: '0', exact: true })).toBeVisible();

  // nome repetido (sem diferenciar maiúsculas) é recusado no campo
  const novo = carla.getByRole('region', { name: 'Novo tipo' });
  await novo.getByLabel('Nome').fill(nomePalestra.toUpperCase());
  await novo.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(novo.getByText('Já existe um tipo com este nome.')).toBeVisible();

  // --- diego (aluno) não acessa a tela -----------------------------------------------------
  const diego = await entrar(browser, 'diego');
  await diego.goto('tipos-iniciativa');
  await expect(diego.getByText(/You are logged in as/i)).toBeVisible();
  await expect(diego.getByRole('heading', { name: 'Tipos de iniciativa' })).toHaveCount(0);

  // --- ana usa o tipo novo numa submissão ---------------------------------------------------
  const ana = await entrar(browser, 'ana');
  const id = await submeter(ana, { titulo: `Iniciativa ${sufixo}`, tipo: nomePalestra });
  await expect(ana.getByText(nomePalestra).first()).toBeVisible();

  // --- com uma iniciativa, o tipo não pode ser excluído -------------------------------------
  await carla.reload();
  await expect(linha.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  await expect(carla.getByRole('button', { name: `Excluir ${nomePalestra}` })).toBeDisabled();

  // --- carla renomeia e troca a cor: a iniciativa da ana mostra o nome novo -----------------
  const renomeado = `${nomePalestra} Magna`;
  await carla.getByRole('button', { name: `Editar ${nomePalestra}` }).click();
  await carla.getByRole('textbox', { name: 'Nome' }).last().fill(renomeado);
  await carla.getByRole('button', { name: 'Salvar' }).click();
  await expect(carla.getByText('Tipo alterado.').first()).toBeVisible();
  await expect(linhaDoTipo(carla, renomeado)).toContainText(codigo);

  await ana.goto(`iniciativas/${id}`);
  await expect(ana.getByText(renomeado).first()).toBeVisible();

  // --- carla desativa: o tipo some da submissão, mas a iniciativa continua com ele ----------
  await carla.getByRole('button', { name: `Desativar ${renomeado}` }).click();
  await expect(carla.getByText(`"${renomeado}" desativado.`).first()).toBeVisible();
  await expect(linhaDoTipo(carla, renomeado)).toContainText('Desativado');

  await ana.goto('iniciativas/nova');
  await expect(ana.locator('#f-tipo option', { hasText: renomeado })).toHaveCount(0);
  await ana.goto(`iniciativas/${id}`);
  await expect(ana.getByText(renomeado).first()).toBeVisible();

  // --- ativar de novo devolve o tipo à submissão --------------------------------------------
  await carla.getByRole('button', { name: `Ativar ${renomeado}` }).click();
  await expect(carla.getByText(`"${renomeado}" ativado.`).first()).toBeVisible();
  await ana.goto('iniciativas/nova');
  await expect(ana.locator('#f-tipo option', { hasText: renomeado })).toHaveCount(1);

  // --- um tipo sem iniciativas pode ser excluído (com confirmação) --------------------------
  const nomeLiga = `Liga ${sufixo}`;
  await cadastrarTipo(carla, nomeLiga, '#F59E0B');
  await carla.getByRole('button', { name: `Excluir ${nomeLiga}` }).click();
  await expect(carla.getByRole('alertdialog', { name: 'Excluir tipo?' })).toBeVisible();
  await carla.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(carla.getByText(`"${nomeLiga}" excluído.`).first()).toBeVisible();
  await expect(linhaDoTipo(carla, nomeLiga)).toHaveCount(0);
});

test('calendário: o comitê altera as datas de uma aprovada (botão e arrastar)', async ({
  browser,
}) => {
  await garantirTipo(browser, 'Evento', '#F7AE85');
  const titulo = `Encontro ${sufixo}`;

  // --- ana submete sem votação, com horário; elisa aprova -----------------------------------
  const ana = await entrar(browser, 'ana');
  const id = await submeter(ana, {
    titulo,
    tipo: 'Evento',
    comVotacao: false,
    horaInicio: '09:00',
    horaFim: '10:00',
  });
  await aprovar(browser, ana, id);

  // --- diego (aluno) vê o evento, mas não tem "Alterar datas" -------------------------------
  const diego = await entrar(browser, 'diego');
  await diego.goto('calendario');
  await diego.getByText(titulo).first().click();
  const popoverDiego = diego.getByRole('dialog', { name: titulo });
  await expect(popoverDiego).toContainText('09:00 às 10:00');
  await expect(popoverDiego.getByRole('button', { name: 'Alterar datas' })).toHaveCount(0);

  // --- carla (comitê) altera o horário pelo botão do popover --------------------------------
  const carla = await entrar(browser, 'carla');
  await carla.goto('calendario');
  await expect(carla.getByText(/você pode alterar as datas/)).toBeVisible();
  await carla.getByText(titulo).first().click();
  await carla.getByRole('dialog', { name: titulo }).getByRole('button', { name: 'Alterar datas' }).click();

  const dialogo = carla.getByRole('dialog', { name: 'Alterar datas' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByLabel('Data de início')).toHaveValue(hoje);
  await expect(dialogo.getByLabel('Hora de início')).toHaveValue('09:00');

  // validação antes de enviar
  await dialogo.getByLabel('Hora de término').fill('08:00');
  await dialogo.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialogo.getByText('A hora de término deve ser posterior à de início.')).toBeVisible();

  await dialogo.getByLabel('Hora de início').fill('14:00');
  await dialogo.getByLabel('Hora de término').fill('15:30');
  await dialogo.getByRole('button', { name: 'Salvar' }).click();
  await expect(carla.getByText('Datas alteradas.').first()).toBeVisible();
  await expect(dialogo).toBeHidden();

  await carla.getByText(titulo).first().click();
  await expect(carla.getByRole('dialog', { name: titulo })).toContainText('14:00 às 15:30');
  await carla.keyboard.press('Escape');

  // o histórico da iniciativa registra a mudança
  await ana.goto(`iniciativas/${id}`);
  await ana.getByText(/Histórico de status/).click();
  await expect(ana.getByText(/Datas alteradas: de .* para .*14:00–15:30/).first()).toBeVisible();

  // --- arrastar: abre o diálogo com a proposta e nada muda sem salvar -----------------------
  await carla.goto('calendario');
  const evento = carla.locator('.fc-event', { hasText: titulo }).first();
  await expect(evento).toBeVisible();
  // Destino: o dia seguinte, ou o anterior se o seguinte não estiver na grade do mês.
  const amanha = carla.locator(`td.fc-daygrid-day[data-date="${diaRelativo(1)}"]`);
  const destinoDia = (await amanha.count()) > 0 ? diaRelativo(1) : diaRelativo(-1);
  const destino = carla.locator(`td.fc-daygrid-day[data-date="${destinoDia}"]`);

  const origem = await evento.boundingBox();
  const alvo = await destino.boundingBox();
  if (!origem || !alvo) throw new Error('Evento ou dia de destino sem posição na tela.');
  await carla.mouse.move(origem.x + origem.width / 2, origem.y + origem.height / 2);
  await carla.mouse.down();
  await carla.mouse.move(alvo.x + alvo.width / 2, alvo.y + alvo.height / 2, { steps: 15 });
  await carla.mouse.up();

  const proposta = carla.getByRole('dialog', { name: 'Alterar datas' });
  await expect(proposta).toContainText('Ainda não foi salvo.');
  await expect(proposta.getByLabel('Data de início')).toHaveValue(destinoDia);
  await expect(proposta.getByLabel('Hora de início')).toHaveValue('14:00');
  await proposta.getByRole('button', { name: 'Cancelar' }).click();
  await expect(proposta).toBeHidden();

  // cancelado: o evento continua no dia original
  await expect(
    carla.locator(`td.fc-daygrid-day[data-date="${hoje}"]`).getByText(titulo),
  ).toBeVisible();
});
