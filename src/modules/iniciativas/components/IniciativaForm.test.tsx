import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../services/api';
import { MENSAGENS } from '../iniciativa.schema';
import { IniciativaForm } from './IniciativaForm';

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@cincoders/cinnamon', () => ({ toast }));

function montar(props: Partial<React.ComponentProps<typeof IniciativaForm>> = {}) {
  const aoEnviar = props.aoEnviar ?? vi.fn().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <IniciativaForm titulo="Submeter iniciativa" rotuloEnvio="Submeter iniciativa" {...props} aoEnviar={aoEnviar} />
    </MemoryRouter>,
  );
  return { aoEnviar: aoEnviar as ReturnType<typeof vi.fn> };
}

const digitar = (rotulo: string | RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencherTudo() {
  digitar('Tipo', 'EVENTO');
  digitar('Título', 'Semana de Tecnologia');
  digitar('Quantidade de participantes', '80');
  digitar('Descrição resumida', 'Palestras e oficinas.');
  digitar('Descrição detalhada', 'Detalhes da semana.');
  digitar('Data de início', '2099-02-10');
  digitar('Data de término', '2099-02-12');
  digitar('Periodicidade', 'EVENTO_UNICO');
  digitar('Espaço utilizado', 'Auditório do CIn');
  digitar('Organizadores', 'Ana, Bruno');
}

const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Submeter iniciativa' }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IniciativaForm', () => {
  it('mostra os campos e textos de ajuda do protótipo, sem fotos nem rascunho', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Submeter iniciativa' })).toBeInTheDocument();
    for (const rotulo of [
      'Tipo',
      'Título',
      'Quantidade de participantes',
      'Descrição resumida',
      'Descrição detalhada',
      'Data de início',
      'Data de término',
      'Hora de início',
      'Hora de término',
      'Periodicidade',
      'Espaço utilizado',
      'Organizadores',
      'Membros',
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${rotulo}`))).toBeInTheDocument();
    }
    expect(screen.getByText('Até 280 caracteres. Aparece nas listas.')).toBeInTheDocument();
    expect(screen.getByText('Início e término')).toBeInTheDocument();
    expect(
      screen.getByText('Sem horário, a iniciativa aparece como dia inteiro no calendário.'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex.: Auditório do CIn')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Nomes separados por vírgula')).toHaveLength(2);
    expect(screen.queryByText(/foto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rascunho/i)).not.toBeInTheDocument();
  });

  it('switch de votação vem marcado, com a ajuda, e vai no corpo enviado', async () => {
    const { aoEnviar } = montar();
    const caixa = screen.getByLabelText('Enviar para votação geral (tela de like e dislike)');
    expect(caixa).toBeChecked();
    expect(
      screen.getByText(
        'Se desmarcar, a iniciativa vai direto para o comitê ao fim do prazo de sugestões, sem votação.',
      ),
    ).toBeInTheDocument();

    preencherTudo();
    fireEvent.click(caixa);
    expect(caixa).not.toBeChecked();
    enviar();

    await waitFor(() => expect(aoEnviar).toHaveBeenCalledTimes(1));
    expect(aoEnviar.mock.calls[0][0]).toMatchObject({
      tipo: 'EVENTO',
      titulo: 'Semana de Tecnologia',
      participantes: 80,
      horaInicio: null,
      horaFim: null,
      membros: null,
      comVotacao: false,
    });
  });

  it('envia com votação por padrão', async () => {
    const { aoEnviar } = montar();
    preencherTudo();
    enviar();
    await waitFor(() => expect(aoEnviar).toHaveBeenCalled());
    expect(aoEnviar.mock.calls[0][0].comVotacao).toBe(true);
  });

  it('a introdução acompanha a escolha de votação', () => {
    montar({ introducao: (votacao) => (votacao ? 'com votação' : 'sem votação') });
    expect(screen.getByText('com votação')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Enviar para votação geral/));
    expect(screen.getByText('sem votação')).toBeInTheDocument();
  });

  it('formulário vazio: mostra os erros de cliente, não envia e avisa por toast', async () => {
    const { aoEnviar } = montar();
    enviar();

    expect(await screen.findByText(MENSAGENS.tipo)).toBeInTheDocument();
    for (const msg of [
      'Informe o título.',
      'Escreva uma descrição resumida.',
      'Escreva a descrição detalhada.',
      'Informe a data de início.',
      'Informe a data de término.',
      'Selecione a periodicidade.',
      'Informe o espaço utilizado.',
      'Informe ao menos um organizador.',
      'Informe um número maior que zero.',
    ]) {
      expect(screen.getByText(msg)).toBeInTheDocument();
    }
    expect(aoEnviar).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Revise os campos destacados.');
  });

  it('leva o foco ao primeiro campo inválido (na ordem da tela)', async () => {
    montar();
    digitar('Tipo', 'EVENTO');
    enviar();
    await screen.findByText('Informe o título.');
    expect(screen.getByLabelText('Título')).toHaveFocus();
  });

  it('associa o erro ao campo: aria-invalid e aria-describedby', async () => {
    montar();
    enviar();
    const titulo = await screen.findByLabelText('Título');
    await waitFor(() => expect(titulo).toHaveAttribute('aria-invalid', 'true'));
    const erro = screen.getByText('Informe o título.');
    expect(titulo.getAttribute('aria-describedby')).toContain(erro.id);

    // Campo com ajuda e erro referencia os dois.
    const resumo = screen.getByLabelText('Descrição resumida');
    const ids = (resumo.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toContain(screen.getByText('Até 280 caracteres. Aparece nas listas.').id);
    expect(ids).toContain(screen.getByText('Escreva uma descrição resumida.').id);

    // Campo válido não fica marcado.
    expect(screen.getByLabelText(/Membros/)).not.toHaveAttribute('aria-invalid');
  });

  it('mostra as regras de datas e horários (RN-02) no campo certo', async () => {
    montar();
    preencherTudo();
    digitar('Data de término', '2099-02-01');
    digitar('Hora de início', '10:00');
    enviar();
    expect(
      await screen.findByText('A data de término deve ser igual ou posterior à de início.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Informe a hora de término ou apague a de início.')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de término')).toHaveFocus();
  });

  it('erros 422 do servidor preenchem os campos e levam o foco ao primeiro', async () => {
    const aoEnviar = vi.fn().mockRejectedValue(
      new ApiError('Dados inválidos', 422, 'VALIDATION', {
        espaco: ['Espaço indisponível.'],
        titulo: ['Já existe uma iniciativa com este título.'],
      }),
    );
    montar({ aoEnviar });
    preencherTudo();
    enviar();

    expect(await screen.findByText('Já existe uma iniciativa com este título.')).toBeInTheDocument();
    expect(screen.getByText('Espaço indisponível.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Título')).toHaveFocus();
    expect(toast.error).toHaveBeenCalledWith('Revise os campos destacados.');
  });

  it('o erro do servidor some quando o campo é corrigido e reenviado', async () => {
    const aoEnviar = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Inválido', 422, undefined, { espaco: ['Espaço indisponível.'] }))
      .mockResolvedValueOnce(undefined);
    montar({ aoEnviar });
    preencherTudo();
    enviar();
    await screen.findByText('Espaço indisponível.');
    digitar('Espaço utilizado', 'Sala 3');
    enviar();
    await waitFor(() => expect(aoEnviar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Espaço indisponível.')).not.toBeInTheDocument());
  });

  it('erros que não são de campo vão para aoFalhar (ou toast, sem ele)', async () => {
    const falha = new ApiError('Iniciativas com status "Em votação" não podem ser editadas.', 409);
    const aoFalhar = vi.fn();
    montar({ aoEnviar: vi.fn().mockRejectedValue(falha), aoFalhar });
    preencherTudo();
    enviar();
    await waitFor(() => expect(aoFalhar).toHaveBeenCalledWith(falha));
  });

  it('sem aoFalhar, mostra a mensagem do servidor em toast', async () => {
    montar({ aoEnviar: vi.fn().mockRejectedValue(new ApiError('Sem permissão.', 403)) });
    preencherTudo();
    enviar();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sem permissão.'));
  });

  it('usa os valores iniciais e mostra "Cancelar" quando há destino', () => {
    montar({
      valoresIniciais: {
        tipo: 'PESQUISA',
        titulo: 'Já preenchido',
        participantes: '12',
        resumo: 'r',
        detalhe: 'd',
        inicio: '2099-01-01',
        fim: '2099-01-02',
        horaInicio: '08:00',
        horaFim: '09:00',
        periodicidade: 'SEMANAL',
        espaco: 'Sala',
        organizadores: 'Ana',
        membros: 'Bia',
        comVotacao: false,
      },
      hrefCancelar: '/iniciativas/ini-1',
    });
    expect(screen.getByLabelText('Título')).toHaveValue('Já preenchido');
    expect(screen.getByLabelText('Tipo')).toHaveValue('PESQUISA');
    expect(screen.getByLabelText(/Enviar para votação geral/)).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/iniciativas/ini-1');
  });
});
