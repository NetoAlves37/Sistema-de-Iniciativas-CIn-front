import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../services/api';
import { aplicarVotoLocal, painelVotosVisivel, useVoto, type EstadoVotos } from '../useVoto';
import { votoApi } from '../voto.api';
import type { ResultadoVoto } from '../votacao.types';
import { PainelVotos } from './PainelVotos';

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../voto.api', () => ({ votoApi: { votar: vi.fn() } }));

const votar = vi.mocked(votoApi.votar);

/** Painel ligado ao hook, como na página de detalhe. */
function Harness({
  base,
  emVotacao = true,
  podeVotar = true,
  aoConflito,
}: {
  base: EstadoVotos;
  emVotacao?: boolean;
  podeVotar?: boolean;
  aoConflito?: () => void;
}) {
  const { estado, votar: aoVotar, carregando } = useVoto('ini-1', base, { aoConflito });
  return (
    <PainelVotos
      votos={estado}
      emVotacao={emVotacao}
      podeVotar={podeVotar}
      carregando={carregando}
      aoVotar={aoVotar}
    />
  );
}

const SEM_VOTO: EstadoVotos = { meuVoto: 0, likes: 3, dislikes: 1, relevancia: 0.4 };
const like = () => screen.getByRole('button', { name: /^Like/ });
const dislike = () => screen.getByRole('button', { name: /^Dislike/ });

function resposta(r: Partial<ResultadoVoto>): ResultadoVoto {
  return { meuVoto: 1, likes: 4, dislikes: 1, relevancia: 0.5, acao: 'REGISTRADO', ...r };
}

/** Promessa que o teste resolve ou rejeita quando quiser. */
function adiada<T>() {
  let resolver!: (v: T) => void;
  let rejeitar!: (e: unknown) => void;
  const promessa = new Promise<T>((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PainelVotos: estados', () => {
  it('em votação: botões habilitados, dica de retirada, contagens e relevância', () => {
    render(<Harness base={SEM_VOTO} />);
    expect(screen.getByRole('heading', { name: 'Interesse da comunidade' })).toBeInTheDocument();
    expect(screen.getByText('Clique de novo no mesmo botão para retirar seu voto')).toBeInTheDocument();
    expect(like()).toBeEnabled();
    expect(like()).toHaveAccessibleName('Like, 3 votos');
    expect(dislike()).toHaveAccessibleName('Dislike, 1 votos');
    expect(screen.getByText(/4 voto\(s\), 75% positivos\. Índice de relevância: 40/)).toBeInTheDocument();
  });

  it('aria-pressed reflete o meu voto', () => {
    const { rerender } = render(<Harness base={{ ...SEM_VOTO, meuVoto: 1 }} />);
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    expect(dislike()).toHaveAttribute('aria-pressed', 'false');
    rerender(<Harness base={{ ...SEM_VOTO, meuVoto: -1 }} />);
    expect(like()).toHaveAttribute('aria-pressed', 'false');
    expect(dislike()).toHaveAttribute('aria-pressed', 'true');
  });

  it('votação encerrada: botões desabilitados e dica "Votação encerrada"', () => {
    render(<Harness base={SEM_VOTO} emVotacao={false} />);
    expect(screen.getByText('Votação encerrada')).toBeInTheDocument();
    expect(like()).toBeDisabled();
    expect(dislike()).toBeDisabled();
  });

  it('sem permissão de votar, os botões ficam desabilitados', () => {
    render(<Harness base={SEM_VOTO} podeVotar={false} />);
    expect(like()).toBeDisabled();
  });

  it('sem votos: 0 voto(s), 0% positivos', () => {
    render(<Harness base={{ meuVoto: 0, likes: 0, dislikes: 0, relevancia: 0 }} />);
    expect(screen.getByText(/0 voto\(s\), 0% positivos\. Índice de relevância: 0/)).toBeInTheDocument();
  });
});

describe('PainelVotos: votar', () => {
  it('atualiza na hora (otimista) e confirma com a resposta do servidor', async () => {
    const pendente = adiada<ResultadoVoto>();
    votar.mockReturnValue(pendente.promessa);
    render(<Harness base={SEM_VOTO} />);

    fireEvent.click(like());
    // Antes da resposta: contagem e aria-pressed já mudaram.
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    expect(like()).toHaveAccessibleName('Like, 4 votos');
    expect(votar).toHaveBeenCalledWith('ini-1', 1);

    pendente.resolver(resposta({ likes: 5, dislikes: 1, relevancia: 0.55 }));
    await waitFor(() => expect(like()).toHaveAccessibleName('Like, 5 votos'));
    expect(screen.getByText(/Índice de relevância: 55/)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Voto registrado');
  });

  it('retirar: clicar de novo no mesmo botão tira o voto', async () => {
    votar.mockResolvedValue(resposta({ meuVoto: 0, likes: 2, acao: 'RETIRADO' }));
    render(<Harness base={{ ...SEM_VOTO, meuVoto: 1 }} />);
    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'false');
    expect(like()).toHaveAccessibleName('Like, 2 votos');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Voto retirado'));
    expect(votar).toHaveBeenCalledWith('ini-1', 1);
  });

  it('trocar: de like para dislike move a contagem', async () => {
    votar.mockResolvedValue(
      resposta({ meuVoto: -1, likes: 2, dislikes: 2, acao: 'ALTERADO', relevancia: 0.2 }),
    );
    render(<Harness base={{ ...SEM_VOTO, meuVoto: 1 }} />);
    fireEvent.click(dislike());
    expect(like()).toHaveAccessibleName('Like, 2 votos');
    expect(dislike()).toHaveAccessibleName('Dislike, 2 votos');
    expect(dislike()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Voto alterado'));
  });

  it('rollback: se o servidor recusar, volta ao estado anterior e mostra o erro', async () => {
    const pendente = adiada<ResultadoVoto>();
    votar.mockReturnValue(pendente.promessa);
    render(<Harness base={SEM_VOTO} />);

    fireEvent.click(like());
    expect(like()).toHaveAccessibleName('Like, 4 votos');

    pendente.rejeitar(new Error('Falha de rede.'));
    await waitFor(() => expect(like()).toHaveAccessibleName('Like, 3 votos'));
    expect(like()).toHaveAttribute('aria-pressed', 'false');
    expect(toast.error).toHaveBeenCalledWith('Falha de rede.');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('409 (votação encerrada): rollback, toast com a mensagem e pede recarga', async () => {
    votar.mockRejectedValue(new ApiError('A votação desta iniciativa foi encerrada.', 409));
    const aoConflito = vi.fn();
    render(<Harness base={SEM_VOTO} aoConflito={aoConflito} />);
    fireEvent.click(dislike());
    await waitFor(() => expect(aoConflito).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith('A votação desta iniciativa foi encerrada.');
    expect(dislike()).toHaveAccessibleName('Dislike, 1 votos');
    expect(dislike()).toHaveAttribute('aria-pressed', 'false');
  });

  it('ignora cliques enquanto um voto está em andamento', async () => {
    const pendente = adiada<ResultadoVoto>();
    votar.mockReturnValue(pendente.promessa);
    render(<Harness base={SEM_VOTO} />);
    fireEvent.click(like());
    expect(like()).toBeDisabled();
    fireEvent.click(like());
    expect(votar).toHaveBeenCalledTimes(1);
    pendente.resolver(resposta({}));
    await waitFor(() => expect(like()).toBeEnabled());
  });

  it('quando o detalhe é recarregado com valores novos, vale o do servidor', async () => {
    votar.mockResolvedValue(resposta({ likes: 4 }));
    const { rerender } = render(<Harness base={SEM_VOTO} />);
    fireEvent.click(like());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    rerender(<Harness base={{ meuVoto: 1, likes: 9, dislikes: 1, relevancia: 0.6 }} />);
    expect(like()).toHaveAccessibleName('Like, 9 votos');
  });
});

describe('funções de votação', () => {
  it('aplicarVotoLocal registra, troca e retira', () => {
    const base: EstadoVotos = { meuVoto: 0, likes: 1, dislikes: 1, relevancia: 0.3 };
    const registrado = aplicarVotoLocal(base, 1);
    expect(registrado).toMatchObject({ meuVoto: 1, likes: 2, dislikes: 1, relevancia: 0.3 });
    expect(aplicarVotoLocal(registrado, -1)).toMatchObject({ meuVoto: -1, likes: 1, dislikes: 2 });
    expect(aplicarVotoLocal(registrado, 1)).toMatchObject({ meuVoto: 0, likes: 1, dislikes: 1 });
    expect(aplicarVotoLocal({ ...base, meuVoto: -1 }, -1)).toMatchObject({ meuVoto: 0, dislikes: 0 });
  });

  it('painelVotosVisivel: em votação sempre; depois dela só se houve votos', () => {
    expect(painelVotosVisivel('EM_VOTACAO', 0)).toBe(true);
    expect(painelVotosVisivel('EM_ANALISE', 3)).toBe(true);
    expect(painelVotosVisivel('APROVADA', 1)).toBe(true);
    expect(painelVotosVisivel('REPROVADA', 0)).toBe(false);
    expect(painelVotosVisivel('EM_ANDAMENTO', 5)).toBe(false);
  });
});
