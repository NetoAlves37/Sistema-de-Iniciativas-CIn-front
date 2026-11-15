import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { ApiError } from '../../services/api';
import { tiposApi } from '../../modules/iniciativas/tipos.api';
import { TIPOS_DE_TESTE } from '../../modules/iniciativas/tipos.fixtures';
import TiposPage from './index';

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../modules/iniciativas/tipos.api', () => ({
  tiposApi: { listar: vi.fn(), cadastrar: vi.fn(), alterar: vi.fn(), excluir: vi.fn() },
}));
const api = vi.mocked(tiposApi);

const linhaDe = (nome: string) => screen.getByRole('row', { name: new RegExp(nome) });

describe('<TiposPage>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listar.mockResolvedValue(TIPOS_DE_TESTE);
  });

  it('lista os tipos com código, quantidade de iniciativas e situação', () => {
    render(<TiposPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tipos de iniciativa' })).toBeInTheDocument();
    const extensao = linhaDe('Extensão');
    expect(extensao).toHaveTextContent('EXTENSAO');
    expect(extensao).toHaveTextContent('4');
    expect(extensao).toHaveTextContent('Ativo');
  });

  it('não deixa excluir tipo com iniciativas associadas', () => {
    render(<TiposPage />);
    expect(within(linhaDe('Extensão')).getByRole('button', { name: 'Excluir Extensão' })).toBeDisabled();
    expect(within(linhaDe('Pesquisa')).getByRole('button', { name: 'Excluir Pesquisa' })).toBeEnabled();
  });

  it('cadastra um tipo novo e recarrega a lista', async () => {
    api.cadastrar.mockResolvedValue({
      id: 9,
      code: 'PALESTRA',
      nome: 'Palestra',
      cor: '#112233',
      ativo: true,
      iniciativas: 0,
    });
    render(<TiposPage />);
    const novo = screen.getByRole('region', { name: 'Novo tipo' });

    fireEvent.change(within(novo).getByLabelText('Nome'), { target: { value: 'Palestra' } });
    fireEvent.change(within(novo).getByLabelText('Cor em hexadecimal'), {
      target: { value: '#112233' },
    });
    fireEvent.click(within(novo).getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(api.cadastrar).toHaveBeenCalledWith({ nome: 'Palestra', cor: '#112233' }),
    );
    await waitFor(() => expect(api.listar).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Tipo "Palestra" cadastrado.');
  });

  it('valida nome e cor antes de enviar', async () => {
    render(<TiposPage />);
    const novo = screen.getByRole('region', { name: 'Novo tipo' });
    fireEvent.change(within(novo).getByLabelText('Cor em hexadecimal'), {
      target: { value: 'azul' },
    });
    fireEvent.click(within(novo).getByRole('button', { name: 'Cadastrar' }));

    expect(await within(novo).findByText('Informe o nome do tipo.')).toBeInTheDocument();
    expect(within(novo).getByText('Informe a cor no formato #RRGGBB.')).toBeInTheDocument();
    expect(api.cadastrar).not.toHaveBeenCalled();
  });

  it('nome repetido (422 do backend) aparece no campo', async () => {
    api.cadastrar.mockRejectedValue(
      new ApiError('Revise', 422, 'VALIDACAO', { nome: ['Já existe um tipo com este nome.'] }),
    );
    render(<TiposPage />);
    const novo = screen.getByRole('region', { name: 'Novo tipo' });
    fireEvent.change(within(novo).getByLabelText('Nome'), { target: { value: 'evento' } });
    fireEvent.click(within(novo).getByRole('button', { name: 'Cadastrar' }));
    expect(await within(novo).findByText('Já existe um tipo com este nome.')).toBeInTheDocument();
  });

  it('edita nome e cor em linha', async () => {
    api.alterar.mockResolvedValue({ ...TIPOS_DE_TESTE[2], nome: 'Festival' });
    render(<TiposPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar Evento' }));

    const nome = screen.getByDisplayValue('Evento');
    fireEvent.change(nome, { target: { value: 'Festival' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.alterar).toHaveBeenCalledWith(3, { nome: 'Festival', cor: '#F7AE85' }),
    );
  });

  it('desativa um tipo', async () => {
    api.alterar.mockResolvedValue({ ...TIPOS_DE_TESTE[1], ativo: false });
    render(<TiposPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Desativar Pesquisa' }));
    await waitFor(() => expect(api.alterar).toHaveBeenCalledWith(2, { ativo: false }));
    expect(toast.success).toHaveBeenCalledWith('"Pesquisa" desativado.');
  });

  it('exclui depois de confirmar', async () => {
    api.excluir.mockResolvedValue();
    render(<TiposPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Pesquisa' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(api.excluir).toHaveBeenCalledWith(2));
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<TiposPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
