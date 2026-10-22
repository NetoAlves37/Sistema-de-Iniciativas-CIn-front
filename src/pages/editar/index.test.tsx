import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { umDetalhe } from '../../modules/iniciativas/detalhe.fixtures';
import { iniciativasApi } from '../../modules/iniciativas/iniciativas.api';
import type { DetalheIniciativa } from '../../modules/iniciativas/iniciativas.types';
import { ApiError } from '../../services/api';
import EditarPage from './index';

const { toast, useMe } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useMe: vi.fn(),
}));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../modules/identidade/MeProvider', () => ({ useMe }));
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: { obter: vi.fn(), atualizar: vi.fn(), ressubmeter: vi.fn() },
}));

const obter = vi.mocked(iniciativasApi.obter);
const atualizar = vi.mocked(iniciativasApi.atualizar);
const ressubmeter = vi.mocked(iniciativasApi.ressubmeter);

function montar() {
  return render(
    <MemoryRouter initialEntries={['/iniciativas/ini-1/editar']}>
      <main>
        <Routes>
          <Route path="/iniciativas/:id/editar" element={<EditarPage />} />
          <Route path="/iniciativas/:id" element={<p>Detalhe aberto</p>} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

const editavel = (parcial: Partial<DetalheIniciativa> = {}) =>
  umDetalhe({
    permissoes: { ...umDetalhe().permissoes, podeEditar: true },
    ...parcial,
  });

const reprovada = () =>
  umDetalhe({
    status: 'REPROVADA',
    ultimaJustificativa: 'Faltou detalhar o orçamento.',
    ciclo: 2,
    permissoes: { ...umDetalhe().permissoes, podeRessubmeter: true },
  });

beforeEach(() => {
  vi.clearAllMocks();
  useMe.mockReturnValue({ me: { id: 'u-ana' } });
});

describe('EditarPage', () => {
  it('mostra "Carregando…" enquanto busca a iniciativa', () => {
    obter.mockReturnValue(new Promise(() => {}));
    montar();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('erro de carregamento: cartão "Nada por aqui" com a mensagem do servidor', async () => {
    obter.mockRejectedValue(new ApiError('Iniciativa não encontrada.', 404));
    montar();
    expect(await screen.findByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument();
    expect(screen.getByText('Iniciativa não encontrada.')).toBeInTheDocument();
  });

  it('Em andamento: título, introdução, campos preenchidos e botões Cancelar / Salvar alterações', async () => {
    obter.mockResolvedValue(editavel({ participantes: 80 }));
    montar();

    expect(await screen.findByRole('heading', { name: 'Editar iniciativa' })).toBeInTheDocument();
    expect(
      screen.getByText(
        /^Você pode editar até o fim do refinamento \(.+ restantes\)\. Na votação, a edição é bloqueada\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Semana de Tecnologia');
    expect(screen.getByLabelText('Quantidade de participantes')).toHaveValue(80);
    expect(screen.getByLabelText('Hora de início')).toHaveValue('09:00');
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/iniciativas/ini-1');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    expect(screen.queryByText('Justificativa do comitê')).not.toBeInTheDocument();
  });

  it('salva as alterações, mostra o toast e volta ao detalhe', async () => {
    obter.mockResolvedValue(editavel());
    atualizar.mockResolvedValue(editavel({ titulo: 'Novo título' }));
    montar();
    await screen.findByRole('heading', { name: 'Editar iniciativa' });

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Novo título' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Detalhe aberto')).toBeInTheDocument();
    expect(atualizar).toHaveBeenCalledWith(
      'ini-1',
      expect.objectContaining({ titulo: 'Novo título', participantes: 80, comVotacao: true }),
    );
    expect(toast.success).toHaveBeenCalledWith('Alterações salvas');
    expect(ressubmeter).not.toHaveBeenCalled();
  });

  it('Reprovada: "Editar e ressubmeter", justificativa do comitê e botão de ressubmissão', async () => {
    obter.mockResolvedValue(reprovada());
    montar();

    expect(await screen.findByRole('heading', { name: 'Editar e ressubmeter' })).toBeInTheDocument();
    expect(screen.getByText('Justificativa do comitê')).toBeInTheDocument();
    expect(screen.getByText('Faltou detalhar o orçamento.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Todos os campos já vêm preenchidos. Ao ressubmeter, a iniciativa volta para sugestões e votação, com a contagem de votos zerada.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  it('ressubmete, mostra o toast e volta ao detalhe', async () => {
    obter.mockResolvedValue(reprovada());
    ressubmeter.mockResolvedValue(umDetalhe({ ciclo: 3 }));
    montar();
    await screen.findByRole('heading', { name: 'Editar e ressubmeter' });

    fireEvent.click(screen.getByLabelText(/Enviar para votação geral/));
    fireEvent.click(screen.getByRole('button', { name: 'Ressubmeter iniciativa' }));

    expect(await screen.findByText('Detalhe aberto')).toBeInTheDocument();
    expect(ressubmeter).toHaveBeenCalledWith('ini-1', expect.objectContaining({ comVotacao: false }));
    expect(toast.success).toHaveBeenCalledWith('Iniciativa ressubmetida e aberta a sugestões');
    expect(atualizar).not.toHaveBeenCalled();
  });

  it('sem permissão de editar nem ressubmeter (não é o autor): "Nada por aqui"', async () => {
    useMe.mockReturnValue({ me: { id: 'u-outro' } });
    obter.mockResolvedValue(umDetalhe());
    montar();
    expect(await screen.findByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument();
    expect(screen.getByText('Só o autor pode editar esta iniciativa.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  it('sem permissão por causa do status: mensagem com o rótulo do status', async () => {
    obter.mockResolvedValue(umDetalhe({ status: 'EM_VOTACAO' }));
    montar();
    expect(
      await screen.findByText('Iniciativas com status "Em votação" não podem ser editadas.'),
    ).toBeInTheDocument();
  });

  it('erros de validação do cliente impedem o envio', async () => {
    obter.mockResolvedValue(editavel());
    montar();
    await screen.findByRole('heading', { name: 'Editar iniciativa' });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveFocus();
    expect(atualizar).not.toHaveBeenCalled();
  });

  it('erro 422 do servidor preenche o campo', async () => {
    obter.mockResolvedValue(editavel());
    atualizar.mockRejectedValue(
      new ApiError('Dados inválidos', 422, undefined, { espaco: ['Espaço indisponível.'] }),
    );
    montar();
    await screen.findByRole('heading', { name: 'Editar iniciativa' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Espaço indisponível.')).toBeInTheDocument();
    expect(screen.getByLabelText('Espaço utilizado')).toHaveFocus();
  });

  it('409: avisa com a mensagem do servidor e recarrega (agora sem permissão)', async () => {
    obter.mockResolvedValueOnce(editavel());
    obter.mockResolvedValueOnce(umDetalhe({ status: 'EM_VOTACAO' }));
    atualizar.mockRejectedValue(
      new ApiError('Iniciativas com status "Em votação" não podem ser editadas.', 409),
    );
    montar();
    await screen.findByRole('heading', { name: 'Editar iniciativa' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Iniciativas com status "Em votação" não podem ser editadas.',
      ),
    );
    await waitFor(() => expect(obter).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade (edição, ressubmissão e "Nada por aqui")', async () => {
    obter.mockResolvedValue(editavel());
    const edicao = montar();
    await screen.findByRole('heading', { name: 'Editar iniciativa' });
    expect(await axe(edicao.container)).toHaveNoViolations();
    edicao.unmount();

    obter.mockResolvedValue(reprovada());
    const resub = montar();
    await screen.findByRole('heading', { name: 'Editar e ressubmeter' });
    expect(await axe(resub.container)).toHaveNoViolations();
    resub.unmount();

    obter.mockRejectedValue(new ApiError('Iniciativa não encontrada.', 404));
    const vazio = montar();
    await screen.findByRole('heading', { name: 'Nada por aqui' });
    expect(await axe(vazio.container)).toHaveNoViolations();
  });
});
