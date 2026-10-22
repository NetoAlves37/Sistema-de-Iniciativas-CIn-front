import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { umDetalhe } from '../../modules/iniciativas/detalhe.fixtures';
import { iniciativasApi } from '../../modules/iniciativas/iniciativas.api';
import { ApiError } from '../../services/api';
import SubmeterPage from './index';

const { toast, useMe } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useMe: vi.fn(),
}));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../modules/identidade/MeProvider', () => ({ useMe }));
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: { criar: vi.fn() },
}));

const criar = vi.mocked(iniciativasApi.criar);

function montar() {
  return render(
    <MemoryRouter initialEntries={['/iniciativas/nova']}>
      <main>
        <Routes>
          <Route path="/iniciativas/nova" element={<SubmeterPage />} />
          <Route path="/iniciativas/:id" element={<p>Detalhe aberto</p>} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencher() {
  digitar('Tipo', 'PESQUISA');
  digitar('Título', 'Grupo de estudos');
  digitar('Quantidade de participantes', '15');
  digitar('Descrição resumida', 'Estudos semanais.');
  digitar('Descrição detalhada', 'Detalhes dos estudos.');
  digitar('Data de início', '2099-03-01');
  digitar('Data de término', '2099-06-30');
  digitar('Periodicidade', 'SEMANAL');
  digitar('Espaço utilizado', 'Sala E110');
  digitar('Organizadores', 'Ana');
}

beforeEach(() => {
  vi.clearAllMocks();
  useMe.mockReturnValue({ me: { prazos: { refinamentoDias: 3, votacaoDias: 5 } } });
});

describe('SubmeterPage', () => {
  it('mostra o título, a introdução com os prazos e o botão de envio', () => {
    montar();
    expect(screen.getByRole('heading', { level: 1, name: 'Submeter iniciativa' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Preencha os campos e submeta. A iniciativa fica 3 dia(s) aberta a sugestões e depois 5 dia(s) em votação, antes de ir para o comitê.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submeter iniciativa' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('desmarcar a votação omite a parte da votação na introdução', () => {
    montar();
    fireEvent.click(screen.getByLabelText(/Enviar para votação geral/));
    expect(
      screen.getByText(
        'Preencha os campos e submeta. A iniciativa fica 3 dia(s) aberta a sugestões e depois segue para o comitê, sem votação.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/em votação, antes de ir/)).not.toBeInTheDocument();
  });

  it('enquanto o perfil não carrega, mostra só a frase inicial', () => {
    useMe.mockReturnValue({ me: undefined });
    montar();
    expect(screen.getByText('Preencha os campos e submeta.')).toBeInTheDocument();
  });

  it('com erros de cliente, não chama a API', async () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));
    expect(await screen.findByText('Informe o título.')).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Revise os campos destacados.');
  });

  it('submete, mostra o toast e abre o detalhe da nova iniciativa', async () => {
    criar.mockResolvedValue(umDetalhe({ id: 'nova-42' }));
    montar();
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));

    expect(await screen.findByText('Detalhe aberto')).toBeInTheDocument();
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'PESQUISA',
        titulo: 'Grupo de estudos',
        participantes: 15,
        periodicidade: 'SEMANAL',
        comVotacao: true,
        horaInicio: null,
        membros: null,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith('Iniciativa submetida e aberta a sugestões');
  });

  it('erro 422 do servidor preenche o campo e não navega', async () => {
    criar.mockRejectedValue(
      new ApiError('Dados inválidos', 422, undefined, { organizadores: ['Informe ao menos um organizador.'] }),
    );
    montar();
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));
    expect(await screen.findByText('Informe ao menos um organizador.')).toBeInTheDocument();
    expect(screen.getByLabelText('Organizadores')).toHaveFocus();
    expect(screen.queryByText('Detalhe aberto')).not.toBeInTheDocument();
  });

  it('outros erros viram toast com a mensagem do servidor', async () => {
    criar.mockRejectedValue(new ApiError('Serviço indisponível.', 503));
    montar();
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Serviço indisponível.'));
    expect(screen.queryByText('Detalhe aberto')).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade (vazio e com erros)', async () => {
    const { container } = montar();
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));
    await screen.findByText('Informe o título.');
    expect(await axe(container)).toHaveNoViolations();
  });
});
