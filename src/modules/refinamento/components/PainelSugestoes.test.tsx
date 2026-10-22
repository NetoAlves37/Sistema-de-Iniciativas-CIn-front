import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Comentario } from '../comentarios.api';
import { PainelSugestoes } from './PainelSugestoes';

function comentario(parcial: Partial<Comentario> & { id: string }): Comentario {
  return {
    ciclo: 1,
    autor: { id: 'u-bruno', nome: 'Bruno Lima', perfil: 'PROFESSOR', ehAutorDaIniciativa: false },
    texto: 'Sugiro mais divulgação.',
    criadoEm: '2099-01-02T10:00:00.000Z',
    ...parcial,
  };
}

function montar(props: Partial<React.ComponentProps<typeof PainelSugestoes>> = {}) {
  const aoEnviar = props.aoEnviar ?? vi.fn().mockResolvedValue(true);
  render(
    <PainelSugestoes comentarios={[]} cicloAtual={1} aberto {...props} aoEnviar={aoEnviar} />,
  );
  return { aoEnviar };
}

describe('PainelSugestoes', () => {
  it('sem comentários e aberto: convida a contribuir', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Sugestões de melhoria' })).toBeInTheDocument();
    expect(screen.getByText('Ainda não há sugestões. Seja o primeiro a contribuir.')).toBeInTheDocument();
    expect(screen.getByText('0 comentário(s)')).toBeInTheDocument();
  });

  it('fechado fora do refinamento: sem caixa, com aviso de fim da fase', () => {
    montar({ aberto: false, comentarios: [comentario({ id: 'c1' })] });
    expect(screen.getByText('A fase de sugestões terminou.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sua sugestão')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar sugestão' })).not.toBeInTheDocument();
  });

  it('fechado e sem comentários', () => {
    montar({ aberto: false });
    expect(screen.getByText('Nenhuma sugestão foi registrada.')).toBeInTheDocument();
    expect(screen.getByText('A fase de sugestões terminou.')).toBeInTheDocument();
  });

  it('cada comentário mostra avatar com iniciais, nome, perfil, data e texto', () => {
    montar({ comentarios: [comentario({ id: 'c1' })] });
    expect(screen.getByText('BL')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('Professor')).toBeInTheDocument();
    expect(screen.getByText('02/01/2099', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Sugiro mais divulgação.')).toBeInTheDocument();
  });

  it('o autor da iniciativa leva a tag "Autor" no lugar do perfil', () => {
    montar({
      comentarios: [
        comentario({
          id: 'c1',
          autor: { id: 'u-ana', nome: 'Ana', perfil: 'ALUNO', ehAutorDaIniciativa: true },
        }),
      ],
    });
    expect(screen.getByText('Autor')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByText('Aluno')).not.toBeInTheDocument();
  });

  it('ciclo 1: sem separadores', () => {
    montar({ comentarios: [comentario({ id: 'c1' }), comentario({ id: 'c2' })] });
    expect(screen.queryByText(/^Ciclo/)).not.toBeInTheDocument();
  });

  it('ciclo atual > 1: agrupa por ciclo, do mais recente para o mais antigo, com separadores', () => {
    montar({
      cicloAtual: 3,
      comentarios: [
        comentario({ id: 'a', ciclo: 1, texto: 'do primeiro' }),
        comentario({ id: 'b', ciclo: 3, texto: 'do terceiro A' }),
        comentario({ id: 'c', ciclo: 2, texto: 'do segundo' }),
        comentario({ id: 'd', ciclo: 3, texto: 'do terceiro B' }),
      ],
    });
    const itens = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(itens[0]).toBe('Ciclo 3 (atual)');
    expect(itens[1]).toContain('do terceiro A');
    expect(itens[2]).toContain('do terceiro B');
    expect(itens[3]).toBe('Ciclo 2 (antes da reprovação)');
    expect(itens[4]).toContain('do segundo');
    expect(itens[5]).toBe('Ciclo 1 (antes da reprovação)');
    expect(itens[6]).toContain('do primeiro');
    expect(screen.getAllByText(/^Ciclo \d/)).toHaveLength(3);
  });

  it('enviar vazio ou só espaços mostra o erro e não envia', () => {
    const { aoEnviar } = montar();
    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
    const erro = screen.getByText('Escreva sua sugestão antes de enviar.');
    expect(screen.getByLabelText('Sua sugestão')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Sua sugestão').getAttribute('aria-describedby')).toBe(erro.id);
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it('a caixa tem o placeholder e o limite de 1000 caracteres', () => {
    montar();
    const caixa = screen.getByLabelText('Sua sugestão');
    expect(caixa).toHaveAttribute('placeholder', 'O que poderia melhorar nesta iniciativa?');
    expect(caixa).toHaveAttribute('maxlength', '1000');
  });

  it('envia o texto sem espaços nas pontas e limpa a caixa em caso de sucesso', async () => {
    const { aoEnviar } = montar();
    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: '  Ótima ideia  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
    await waitFor(() => expect(aoEnviar).toHaveBeenCalledWith('Ótima ideia'));
    await waitFor(() => expect(screen.getByLabelText('Sua sugestão')).toHaveValue(''));
  });

  it('mantém o texto quando o envio falha', async () => {
    const { aoEnviar } = montar({ aoEnviar: vi.fn().mockResolvedValue(false) });
    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: 'Minha ideia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
    await waitFor(() => expect(aoEnviar).toHaveBeenCalled());
    expect(screen.getByLabelText('Sua sugestão')).toHaveValue('Minha ideia');
  });

  it('limpa o erro depois de um envio válido', async () => {
    montar();
    const botao = screen.getByRole('button', { name: 'Enviar sugestão' });
    fireEvent.click(botao);
    expect(screen.getByText('Escreva sua sugestão antes de enviar.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: 'ok' } });
    fireEvent.click(botao);
    await waitFor(() =>
      expect(screen.queryByText('Escreva sua sugestão antes de enviar.')).not.toBeInTheDocument(),
    );
    expect(within(document.body).getByRole('button', { name: 'Enviar sugestão' })).toBeEnabled();
  });
});
