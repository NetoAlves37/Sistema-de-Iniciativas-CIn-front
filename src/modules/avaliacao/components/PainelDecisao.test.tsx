import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PainelDecisao } from './PainelDecisao';

function montar(props: Partial<React.ComponentProps<typeof PainelDecisao>> = {}) {
  const aoAprovar = props.aoAprovar ?? vi.fn().mockResolvedValue(true);
  const aoReprovar = props.aoReprovar ?? vi.fn().mockResolvedValue(true);
  render(
    <PainelDecisao
      titulo="Semana de Tecnologia"
      podeDecidir
      {...props}
      aoAprovar={aoAprovar}
      aoReprovar={aoReprovar}
    />,
  );
  return { aoAprovar, aoReprovar };
}

describe('PainelDecisao', () => {
  it('bloqueado para o autor: mostra o motivo e desabilita os botões', () => {
    const motivo =
      'Você é o autor desta iniciativa e não pode registrar a decisão. Outro membro do comitê deve fazê-lo.';
    montar({ podeDecidir: false, motivoNaoPodeDecidir: motivo });
    expect(screen.getByText(motivo)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reprovar' })).toBeDisabled();
  });

  it('habilitado: explica que basta um registro', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Decisão do comitê' })).toBeInTheDocument();
    expect(
      screen.getByText('Registre a decisão tomada na reunião do comitê. Basta um registro.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeEnabled();
  });

  it('aprovar pede confirmação com o título e só então registra', async () => {
    const { aoAprovar } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));

    expect(await screen.findByText('Registrar a aprovação de "Semana de Tecnologia"?')).toBeInTheDocument();
    expect(aoAprovar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprovação' }));
    await waitFor(() => expect(aoAprovar).toHaveBeenCalledTimes(1));
  });

  it('cancelar a confirmação não aprova', async () => {
    const { aoAprovar } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.queryByText('Registrar a aprovação de "Semana de Tecnologia"?')).not.toBeInTheDocument(),
    );
    expect(aoAprovar).not.toHaveBeenCalled();
  });

  it('reprovar abre a caixa de justificativa; cancelar a fecha e limpa', () => {
    montar();
    expect(screen.queryByLabelText('Justificativa')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    const caixa = screen.getByLabelText('Justificativa');
    expect(caixa).toHaveAttribute('maxlength', '2000');
    fireEvent.change(caixa, { target: { value: 'texto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByLabelText('Justificativa')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    expect(screen.getByLabelText('Justificativa')).toHaveValue('');
  });

  it('justificativa é obrigatória: vazia ou só espaços não reprova', () => {
    const { aoReprovar } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    fireEvent.change(screen.getByLabelText('Justificativa'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));

    const erro = screen.getByText('A justificativa é obrigatória para reprovar.');
    expect(erro).toBeInTheDocument();
    expect(screen.getByLabelText('Justificativa')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Justificativa').getAttribute('aria-describedby')).toBe(erro.id);
    expect(aoReprovar).not.toHaveBeenCalled();
  });

  it('reprova com a justificativa (sem espaços nas pontas) e fecha a caixa', async () => {
    const { aoReprovar } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    fireEvent.change(screen.getByLabelText('Justificativa'), {
      target: { value: '  Faltou orçamento.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));
    await waitFor(() => expect(aoReprovar).toHaveBeenCalledWith('Faltou orçamento.'));
    await waitFor(() => expect(screen.queryByLabelText('Justificativa')).not.toBeInTheDocument());
  });

  it('se a reprovação falhar, mantém a caixa e o texto', async () => {
    const { aoReprovar } = montar({ aoReprovar: vi.fn().mockResolvedValue(false) });
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    fireEvent.change(screen.getByLabelText('Justificativa'), { target: { value: 'Motivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));
    await waitFor(() => expect(aoReprovar).toHaveBeenCalled());
    expect(screen.getByLabelText('Justificativa')).toHaveValue('Motivo');
  });

  it('mostra o erro de justificativa devolvido pelo servidor', () => {
    montar({ erroJustificativa: 'A justificativa deve ter até 2000 caracteres.' });
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    expect(screen.getByText('A justificativa deve ter até 2000 caracteres.')).toBeInTheDocument();
  });
});
