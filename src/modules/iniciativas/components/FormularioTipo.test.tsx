import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { ApiError } from '../../../services/api';
import { FormularioTipo, validarTipo } from './FormularioTipo';

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@cincoders/cinnamon', () => ({ toast }));

function montar(props: Partial<React.ComponentProps<typeof FormularioTipo>> = {}) {
  const aoEnviar = props.aoEnviar ?? vi.fn().mockResolvedValue(undefined);
  const resultado = render(
    <FormularioTipo
      valoresIniciais={{ nome: '', cor: '#3B82F6' }}
      rotuloEnvio="Cadastrar"
      {...props}
      aoEnviar={aoEnviar}
    />,
  );
  return { ...resultado, aoEnviar: aoEnviar as ReturnType<typeof vi.fn> };
}

const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

describe('validarTipo', () => {
  it('usa as mesmas regras e mensagens do backend', () => {
    expect(validarTipo({ nome: 'Liga', cor: '#000000' })).toEqual({});
    expect(validarTipo({ nome: ' ', cor: '' })).toEqual({
      nome: 'Informe o nome do tipo.',
      cor: 'Escolha a cor do tipo.',
    });
    expect(validarTipo({ nome: 'x'.repeat(61), cor: '#12' })).toEqual({
      nome: 'O nome deve ter no máximo 60 caracteres.',
      cor: 'Informe a cor no formato #RRGGBB.',
    });
  });
});

describe('<FormularioTipo>', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia nome aparado e cor em maiúsculas', async () => {
    const { aoEnviar } = montar();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '  Palestra ' } });
    fireEvent.change(screen.getByLabelText('Cor em hexadecimal'), { target: { value: '#aa00ff' } });
    enviar();
    await waitFor(() => expect(aoEnviar).toHaveBeenCalledWith({ nome: 'Palestra', cor: '#AA00FF' }));
  });

  it('o seletor de cor e o campo hexadecimal ficam sincronizados', () => {
    montar();
    fireEvent.change(screen.getByLabelText('Escolher a cor'), { target: { value: '#ff0000' } });
    expect(screen.getByLabelText('Cor em hexadecimal')).toHaveValue('#FF0000');
  });

  it('a prévia usa a cor escolhida e o texto mais legível', () => {
    montar();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Liga' } });
    fireEvent.change(screen.getByLabelText('Cor em hexadecimal'), { target: { value: '#000000' } });
    const previa = screen.getByText('Liga', { selector: 'span' });
    expect(previa).toHaveStyle({ backgroundColor: '#000000', color: '#ffffff' });
  });

  it('valida antes de enviar, marca o campo e foca o primeiro erro', async () => {
    const { aoEnviar } = montar();
    enviar();
    expect(await screen.findByText('Informe o nome do tipo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome')).toHaveFocus();
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it('o 422 do backend vai para o campo', async () => {
    montar({
      aoEnviar: vi
        .fn()
        .mockRejectedValue(
          new ApiError('Revise', 422, 'VALIDACAO', { nome: ['Já existe um tipo com este nome.'] }),
        ),
    });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Evento' } });
    enviar();
    expect(await screen.findByText('Já existe um tipo com este nome.')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('outros erros (403, rede) viram toast', async () => {
    montar({ aoEnviar: vi.fn().mockRejectedValue(new ApiError('Sem permissão.', 403)) });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Liga' } });
    enviar();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sem permissão.'));
  });

  it('Cancelar só aparece quando há aoCancelar', () => {
    const aoCancelar = vi.fn();
    const { rerender } = montar();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    rerender(
      <FormularioTipo
        valoresIniciais={{ nome: 'Liga', cor: '#000000' }}
        rotuloEnvio="Salvar"
        aoEnviar={vi.fn()}
        aoCancelar={aoCancelar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoCancelar).toHaveBeenCalled();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = montar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
