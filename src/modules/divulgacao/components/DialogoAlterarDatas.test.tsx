import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { ApiError } from '../../../services/api';
import { iniciativasApi } from '../../iniciativas/iniciativas.api';
import { datasDaOcorrencia } from '../alterarDatas';
import { ocorrencia } from '../divulgacao.fixtures';
import { DialogoAlterarDatas } from './DialogoAlterarDatas';

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../iniciativas/iniciativas.api', () => ({
  iniciativasApi: { alterarDatas: vi.fn() },
}));
const alterarDatas = vi.mocked(iniciativasApi.alterarDatas);

function renderizar(props: { arrastado?: boolean } = {}) {
  const onFechar = vi.fn();
  const onSalvo = vi.fn();
  const resultado = render(
    <DialogoAlterarDatas
      ocorrencia={ocorrencia}
      valoresIniciais={datasDaOcorrencia(ocorrencia)}
      onFechar={onFechar}
      onSalvo={onSalvo}
      {...props}
    />,
  );
  return { ...resultado, onFechar, onSalvo };
}

describe('<DialogoAlterarDatas>', () => {
  beforeEach(() => {
    alterarDatas.mockReset();
    toast.success.mockReset();
  });

  it('é um diálogo modal com as datas atuais da série e o aviso de recorrência', () => {
    renderizar();
    const dialogo = screen.getByRole('dialog', { name: 'Alterar datas' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveTextContent('Semana de Boas-Vindas');
    expect(dialogo).toHaveTextContent(
      'Iniciativa semanal: a mudança vale para todas as ocorrências.',
    );
    expect(screen.getByLabelText('Data de início')).toHaveValue('2026-11-10');
    expect(screen.getByLabelText('Data de término')).toHaveValue('2026-12-20');
    expect(screen.getByLabelText('Hora de início')).toHaveValue('14:00');
    expect(screen.getByLabelText('Hora de término')).toHaveValue('16:00');
    expect(screen.getByLabelText('Data de início')).toHaveFocus();
  });

  it('depois de arrastar, avisa que ainda não foi salvo', () => {
    renderizar({ arrastado: true });
    expect(screen.getByRole('dialog')).toHaveTextContent('Ainda não foi salvo.');
  });

  it('salva a série inteira e avisa quem chamou', async () => {
    alterarDatas.mockResolvedValue({} as never);
    const { onSalvo } = renderizar();

    fireEvent.change(screen.getByLabelText('Data de início'), {
      target: { value: '2026-11-17' },
    });
    fireEvent.change(screen.getByLabelText('Hora de início'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Hora de término'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSalvo).toHaveBeenCalledTimes(1));
    expect(alterarDatas).toHaveBeenCalledWith('ini-1', {
      inicio: '2026-11-17',
      fim: '2026-12-20',
      horaInicio: null,
      horaFim: null,
    });
    expect(toast.success).toHaveBeenCalledWith('Datas alteradas.');
  });

  it('valida antes de enviar e foca o primeiro campo com erro', async () => {
    renderizar();
    fireEvent.change(screen.getByLabelText('Data de término'), {
      target: { value: '2026-11-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('A data de término deve ser igual ou posterior à de início.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Data de término')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Data de término')).toHaveFocus();
    expect(alterarDatas).not.toHaveBeenCalled();
  });

  it('o 422 do backend vai para o campo; o 409 aparece como alerta', async () => {
    alterarDatas.mockRejectedValueOnce(
      new ApiError('Revise', 422, 'VALIDACAO', { inicio: ['Informe uma data de início válida.'] }),
    );
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Informe uma data de início válida.')).toBeInTheDocument();

    alterarDatas.mockRejectedValueOnce(
      new ApiError('Só iniciativas aprovadas podem ter as datas alteradas.', 409),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Só iniciativas aprovadas podem ter as datas alteradas.',
    );
  });

  it('Esc e Cancelar fecham', () => {
    const { onFechar } = renderizar();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onFechar).toHaveBeenCalledTimes(2);
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = renderizar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
