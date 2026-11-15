import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import type { FiltroOcorrencias } from '../../modules/divulgacao/divulgacao.types';
import { ocorrencia } from '../../modules/divulgacao/divulgacao.fixtures';
import { TIPOS_DE_TESTE } from '../../modules/iniciativas/tipos.fixtures';
import { semearTipos } from '../../modules/iniciativas/useTipos';
import CalendarioPage from './index';

const { useMe } = vi.hoisted(() => ({ useMe: vi.fn() }));
vi.mock('../../modules/identidade/MeProvider', () => ({ useMe }));

const { toast, alterarDatas } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  alterarDatas: vi.fn(),
}));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({ iniciativasApi: { alterarDatas } }));

const mockOcorrencias = vi.fn();
vi.mock('../../modules/divulgacao/divulgacao.api', () => ({
  divulgacaoApi: { ocorrencias: (filtro: FiltroOcorrencias) => mockOcorrencias(filtro) },
}));

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const doDia = () => ({ ...ocorrencia, diaInteiro: true, inicio: hoje(), fim: hoje() });

const renderizar = () =>
  render(
    <MemoryRouter>
      <CalendarioPage />
    </MemoryRouter>,
  );

describe('<CalendarioPage>', () => {
  beforeEach(() => {
    mockOcorrencias.mockReset();
    useMe.mockReturnValue({ me: { ehComite: false } });
    mockOcorrencias.mockResolvedValue([doDia()]);
  });

  it('mostra o título, o subtítulo e monta o calendário com as visões', async () => {
    renderizar();

    expect(screen.getByRole('heading', { level: 1, name: 'Calendário' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Iniciativas aprovadas. Clique em um evento para ver os detalhes ou adicioná-lo ao seu Google Agenda.',
      ),
    ).toBeInTheDocument();
    for (const nome of ['Hoje', 'Mês', 'Semana', 'Dia', 'Agenda']) {
      expect(await screen.findByRole('button', { name: nome })).toBeInTheDocument();
    }
  });

  it('a barra lateral tem o botão Submeter, os tipos (todos marcados) e "Só as minhas iniciativas"', async () => {
    renderizar();
    await screen.findByRole('button', { name: 'Hoje' });

    expect(screen.getByRole('link', { name: 'Submeter iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/nova',
    );
    const tipos = screen.getByRole('group', { name: 'Tipos de iniciativa' });
    for (const nome of ['Extensão', 'Pesquisa', 'Evento']) {
      expect(within(tipos).getByRole('checkbox', { name: nome })).toBeChecked();
    }
    const exibir = screen.getByRole('group', { name: 'Exibir' });
    expect(within(exibir).getByRole('checkbox', { name: 'Só as minhas iniciativas' })).not.toBeChecked();
  });

  it('busca as ocorrências do intervalo visível e mostra o evento', async () => {
    renderizar();

    expect(await screen.findByText('Semana de Boas-Vindas')).toBeInTheDocument();
    const filtro = mockOcorrencias.mock.calls[0][0] as FiltroOcorrencias;
    expect(filtro.de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(filtro.ate > filtro.de).toBe(true);
    expect(filtro.tipos).toBeUndefined();
    expect(filtro.minhas).toBeUndefined();
  });

  it('trocar de visão refaz a busca com o novo intervalo', async () => {
    renderizar();
    await screen.findByText('Semana de Boas-Vindas');
    const antes = mockOcorrencias.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Dia' }));

    await waitFor(() => expect(mockOcorrencias.mock.calls.length).toBeGreaterThan(antes));
    const filtro = mockOcorrencias.mock.calls.at(-1)![0] as FiltroOcorrencias;
    expect((Date.parse(filtro.ate) - Date.parse(filtro.de)) / 86_400_000).toBe(1);
  });

  it('desmarcar um tipo refaz a busca só com os tipos marcados', async () => {
    renderizar();
    await screen.findByText('Semana de Boas-Vindas');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pesquisa' }));

    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipos: ['EXTENSAO', 'EVENTO'] }),
      ),
    );
    expect(screen.getByRole('checkbox', { name: 'Pesquisa' })).not.toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pesquisa' }));
    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipos: undefined }),
      ),
    );
  });

  it('"Só as minhas iniciativas" refaz a busca com minhas=true', async () => {
    renderizar();
    await screen.findByText('Semana de Boas-Vindas');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Só as minhas iniciativas' }));

    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith(expect.objectContaining({ minhas: true })),
    );
  });

  it('clicar no evento abre o popover com foco no botão fechar; Esc fecha', async () => {
    renderizar();
    fireEvent.click(await screen.findByText('Semana de Boas-Vindas'));

    const dialogo = await screen.findByRole('dialog', { name: 'Semana de Boas-Vindas' });
    expect(within(dialogo).getByRole('button', { name: 'Fechar' })).toHaveFocus();
    expect(within(dialogo).getByRole('link', { name: 'Ver iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/ini-1',
    );
    expect(within(dialogo).getByRole('link', { name: 'Adicionar ao Google Agenda' })).toHaveAttribute(
      'href',
      ocorrencia.googleAgendaUrl,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicar fora do popover fecha', async () => {
    renderizar();
    fireEvent.click(await screen.findByText('Semana de Boas-Vindas'));
    await screen.findByRole('dialog');

    fireEvent.mouseDown(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mostra o erro e permite tentar de novo', async () => {
    mockOcorrencias
      .mockRejectedValueOnce(new Error('Não foi possível carregar o calendário.'))
      .mockResolvedValue([doDia()]);
    renderizar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar o calendário.');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Semana de Boas-Vindas')).toBeInTheDocument();
  });

  it('sem eventos no período mostra o calendário vazio (sem erro)', async () => {
    mockOcorrencias.mockResolvedValue([]);
    renderizar();
    await screen.findByRole('button', { name: 'Hoje' });
    await waitFor(() => expect(mockOcorrencias).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Semana de Boas-Vindas')).toBeNull();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = renderizar();
    await screen.findByText('Semana de Boas-Vindas');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('usuário sem papel de comitê não vê "Alterar datas" no popover', async () => {
    renderizar();
    fireEvent.click(await screen.findByText('Semana de Boas-Vindas'));
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Alterar datas' })).toBeNull();
  });

  it('comitê/ADMIN: "Alterar datas" abre o diálogo com a série, salva e recarrega o calendário', async () => {
    useMe.mockReturnValue({ me: { ehComite: true } });
    alterarDatas.mockResolvedValue({});
    renderizar();
    expect(screen.getByText(/você pode alterar as datas/)).toBeInTheDocument();

    fireEvent.click(await screen.findByText('Semana de Boas-Vindas'));
    fireEvent.click(await screen.findByRole('button', { name: 'Alterar datas' }));

    const dialogo = await screen.findByRole('dialog', { name: 'Alterar datas' });
    expect(within(dialogo).getByLabelText('Data de início')).toHaveValue('2026-11-10');
    expect(within(dialogo).getByLabelText('Data de término')).toHaveValue('2026-12-20');
    fireEvent.change(within(dialogo).getByLabelText('Data de término'), {
      target: { value: '2026-12-27' },
    });

    const chamadasAntes = mockOcorrencias.mock.calls.length;
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(alterarDatas).toHaveBeenCalledWith('ini-1', {
      inicio: '2026-11-10',
      fim: '2026-12-27',
      horaInicio: null,
      horaFim: null,
    });
    await waitFor(() => expect(mockOcorrencias.mock.calls.length).toBeGreaterThan(chamadasAntes));
  });
  describe('tipos do cadastro nos filtros', () => {
    it('mostra todos os tipos cadastrados, inclusive os desativados, todos marcados', async () => {
      semearTipos([
        ...TIPOS_DE_TESTE,
        { ...TIPOS_DE_TESTE[0], id: 9, code: 'LIGA', nome: 'Liga', ativo: false },
      ]);
      renderizar();
      await screen.findByRole('button', { name: 'Hoje' });
      const tipos = screen.getByRole('group', { name: 'Tipos de iniciativa' });
      for (const nome of ['Extensão', 'Pesquisa', 'Evento', 'Liga']) {
        expect(within(tipos).getByRole('checkbox', { name: nome })).toBeChecked();
      }
      // Todos marcados: não filtra por tipo.
      await waitFor(() =>
        expect(mockOcorrencias).toHaveBeenLastCalledWith(expect.objectContaining({ tipos: undefined })),
      );
    });

    it('um tipo cadastrado depois já aparece marcado', async () => {
      renderizar();
      await screen.findByRole('button', { name: 'Hoje' });
      fireEvent.click(screen.getByRole('checkbox', { name: 'Pesquisa' }));

      act(() =>
        semearTipos([...TIPOS_DE_TESTE, { ...TIPOS_DE_TESTE[0], id: 9, code: 'LIGA', nome: 'Liga' }]),
      );

      expect(await screen.findByRole('checkbox', { name: 'Liga' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Pesquisa' })).not.toBeChecked();
      await waitFor(() =>
        expect(mockOcorrencias).toHaveBeenLastCalledWith(
          expect.objectContaining({ tipos: ['EXTENSAO', 'EVENTO', 'LIGA'] }),
        ),
      );
    });

    it('desmarcar o último tipo não chama a API (e não mostra eventos)', async () => {
      renderizar();
      await screen.findByText('Semana de Boas-Vindas');

      fireEvent.click(screen.getByRole('checkbox', { name: 'Extensão' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Pesquisa' }));
      await waitFor(() =>
        expect(mockOcorrencias).toHaveBeenLastCalledWith(
          expect.objectContaining({ tipos: ['EVENTO'] }),
        ),
      );
      const chamadas = mockOcorrencias.mock.calls.length;

      fireEvent.click(screen.getByRole('checkbox', { name: 'Evento' }));

      await waitFor(() => expect(screen.queryByText('Semana de Boas-Vindas')).toBeNull());
      expect(mockOcorrencias.mock.calls.length).toBe(chamadas);
    });

    it('sem tipos cadastrados, avisa no filtro e ainda busca (sem filtro de tipo)', async () => {
      semearTipos([]);
      renderizar();
      expect(await screen.findByText('Nenhum tipo cadastrado.')).toBeInTheDocument();
      await waitFor(() =>
        expect(mockOcorrencias).toHaveBeenCalledWith(expect.objectContaining({ tipos: undefined })),
      );
    });

    it('o evento usa a cor cadastrada do tipo', async () => {
      semearTipos([{ ...TIPOS_DE_TESTE[2], cor: '#1E3A8A' }]);
      renderizar();
      const titulo = await screen.findByText('Semana de Boas-Vindas');
      const evento = titulo.closest('.fc-event') as HTMLElement;
      expect(evento).toHaveStyle({ backgroundColor: '#1E3A8A' });
    });
  });
});
