import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { avaliacaoApi } from '../../modules/avaliacao/avaliacao.api';
import { umDetalhe } from '../../modules/iniciativas/detalhe.fixtures';
import { iniciativasApi } from '../../modules/iniciativas/iniciativas.api';
import type { DetalheIniciativa, Transicao } from '../../modules/iniciativas/iniciativas.types';
import { comentariosApi, type Comentario } from '../../modules/refinamento/comentarios.api';
import { votoApi } from '../../modules/votacao/voto.api';
import { ApiError } from '../../services/api';
import DetalhePage from './index';

const { toast, useMe } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useMe: vi.fn(),
}));
vi.mock('@cincoders/cinnamon', () => ({ toast }));
vi.mock('../../modules/identidade/MeProvider', () => ({ useMe }));
vi.mock('../../modules/iniciativas/iniciativas.api', () => ({
  iniciativasApi: { obter: vi.fn(), historico: vi.fn() },
}));
vi.mock('../../modules/refinamento/comentarios.api', () => ({
  comentariosApi: { listar: vi.fn(), comentar: vi.fn() },
}));
vi.mock('../../modules/votacao/voto.api', () => ({ votoApi: { votar: vi.fn() } }));
vi.mock('../../modules/avaliacao/avaliacao.api', () => ({ avaliacaoApi: { decidir: vi.fn() } }));

const obter = vi.mocked(iniciativasApi.obter);
const historico = vi.mocked(iniciativasApi.historico);
const listar = vi.mocked(comentariosApi.listar);
const comentar = vi.mocked(comentariosApi.comentar);
const votar = vi.mocked(votoApi.votar);
const decidir = vi.mocked(avaliacaoApi.decidir);

const ME = { id: 'u-ana', nome: 'Ana Souza', perfil: 'ALUNO', ehComite: false };
const ME_COMITE = { id: 'u-carla', nome: 'Carla Dias', perfil: 'COMITE', ehComite: true };

function montar() {
  return render(
    <MemoryRouter initialEntries={['/iniciativas/ini-1']}>
      <main>
        <Routes>
          <Route path="/iniciativas/:id" element={<DetalhePage />} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

function paginaDeComentarios(items: Comentario[]) {
  return { items, meta: { page: 1, limit: 50, total: items.length, totalPages: 1 } };
}

const comentarioDe = (parcial: Partial<Comentario> & { id: string }): Comentario => ({
  ciclo: 1,
  autor: { id: 'u-bruno', nome: 'Bruno Lima', perfil: 'PROFESSOR', ehAutorDaIniciativa: false },
  texto: 'Sugiro mais divulgação.',
  criadoEm: '2099-01-02T10:00:00.000Z',
  ...parcial,
});

const transicao: Transicao = {
  id: 't1',
  ciclo: 1,
  de: null,
  para: 'EM_ANDAMENTO',
  por: 'Ana Souza',
  nota: 'Submetida e aberta a sugestões',
  justificativa: null,
  ocorreuEm: '2099-01-01T10:00:00.000Z',
};

const permissoes = (parcial: Partial<DetalheIniciativa['permissoes']>) => ({
  ...umDetalhe().permissoes,
  ...parcial,
});

const decisaoDe = (resultado: 'APROVADA' | 'REPROVADA') => ({
  resultado,
  justificativa: resultado === 'REPROVADA' ? 'Faltou orçamento.' : null,
  decisor: { nome: 'Carla Dias' },
  decididaEm: '2099-01-05T15:30:00.000Z',
});

async function abrir(d: DetalheIniciativa) {
  obter.mockResolvedValue(d);
  const tela = montar();
  await screen.findByRole('heading', { level: 1, name: d.titulo });
  return tela;
}

beforeEach(() => {
  vi.clearAllMocks();
  useMe.mockReturnValue({ me: ME });
  listar.mockResolvedValue(paginaDeComentarios([]));
  historico.mockResolvedValue([transicao]);
});

describe('DetalhePage: carregamento e erro', () => {
  it('mostra "Carregando…" enquanto busca', () => {
    obter.mockReturnValue(new Promise(() => {}));
    montar();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('404: cartão "Nada por aqui" com a mensagem', async () => {
    obter.mockRejectedValue(new ApiError('Iniciativa não encontrada.', 404));
    montar();
    expect(await screen.findByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument();
    expect(screen.getByText('Iniciativa não encontrada.')).toBeInTheDocument();
  });

  it('falha de rede: "Nada por aqui" com "Tentar de novo" que busca outra vez', async () => {
    obter.mockRejectedValueOnce(new Error('Falha de rede.'));
    obter.mockResolvedValueOnce(umDetalhe());
    montar();
    expect(await screen.findByText('Falha de rede.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Semana de Tecnologia' })).toBeInTheDocument();
  });
});

describe('DetalhePage: cabeçalho, stepper e callout', () => {
  it('mostra título, status, tipo e proponente com o perfil', async () => {
    await abrir(umDetalhe());
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0);
    expect(screen.getByText('Evento', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/Proposta por/)).toHaveTextContent('Proposta por Ana Souza (Aluno)');
    expect(screen.queryByText(/^Ciclo/)).not.toBeInTheDocument();
    expect(screen.queryByText('Sem votação')).not.toBeInTheDocument();
  });

  it('mostra "Ciclo N" quando maior que 1 e a tag "Sem votação"', async () => {
    await abrir(umDetalhe({ ciclo: 2, comVotacao: false }));
    expect(screen.getByText('Ciclo 2')).toBeInTheDocument();
    expect(screen.getByText('Sem votação')).toBeInTheDocument();
    // Stepper com a etapa pulada.
    expect(screen.getByText('sem votação')).toBeInTheDocument();
  });

  it('stepper com etapa atual e callout do status', async () => {
    await abrir(umDetalhe());
    const etapas = screen.getByRole('list', { name: 'Etapas' });
    expect(within(etapas).getByText('Em andamento').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/Aberta a sugestões até/)).toBeInTheDocument();
  });
});

describe('DetalhePage: barra de ações', () => {
  it('autor em andamento: "Editar iniciativa" aponta para a edição', async () => {
    await abrir(umDetalhe({ permissoes: permissoes({ podeEditar: true }) }));
    expect(screen.getByRole('link', { name: 'Editar iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/ini-1/editar',
    );
    expect(screen.queryByRole('link', { name: 'Editar e ressubmeter' })).not.toBeInTheDocument();
  });

  it('autor com iniciativa reprovada: "Editar e ressubmeter"', async () => {
    await abrir(
      umDetalhe({
        status: 'REPROVADA',
        decisao: decisaoDe('REPROVADA'),
        permissoes: permissoes({ podeRessubmeter: true }),
      }),
    );
    expect(screen.getByRole('link', { name: 'Editar e ressubmeter' })).toHaveAttribute(
      'href',
      '/iniciativas/ini-1/editar',
    );
    expect(screen.queryByRole('link', { name: 'Editar iniciativa' })).not.toBeInTheDocument();
    expect(screen.getByText('Justificativa:').closest('p')).toHaveTextContent(
      'Justificativa: Faltou orçamento.',
    );
  });

  it('sem permissões: não há barra de ações', async () => {
    await abrir(umDetalhe());
    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Adicionar ao Google Agenda' })).not.toBeInTheDocument();
  });

  it('aprovada com link: "Adicionar ao Google Agenda" abre em nova aba com noopener', async () => {
    await abrir(
      umDetalhe({
        status: 'APROVADA',
        decisao: decisaoDe('APROVADA'),
        googleAgendaUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
      }),
    );
    const link = screen.getByRole('link', { name: 'Adicionar ao Google Agenda' });
    expect(link).toHaveAttribute('href', 'https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('aprovada sem link: não mostra o botão', async () => {
    await abrir(umDetalhe({ status: 'APROVADA', decisao: decisaoDe('APROVADA') }));
    expect(screen.queryByRole('link', { name: 'Adicionar ao Google Agenda' })).not.toBeInTheDocument();
  });
});

describe('DetalhePage: dados, histórico e painéis', () => {
  it('mostra "Dados da iniciativa" e o histórico recolhido com a contagem', async () => {
    await abrir(umDetalhe());
    expect(screen.getByRole('heading', { name: 'Dados da iniciativa' })).toBeInTheDocument();
    expect(screen.getByText('10/02/2099 a 12/02/2099, das 09:00 às 17:00')).toBeInTheDocument();
    expect(await screen.findByText('Histórico de status (1)')).toBeInTheDocument();
    expect(historico).toHaveBeenCalledWith('ini-1');
  });

  it('em andamento: sugestões abertas e nenhum painel de votos ou de decisão', async () => {
    await abrir(umDetalhe());
    expect(screen.getByLabelText('Sua sugestão')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Interesse da comunidade' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Decisão do comitê' })).not.toBeInTheDocument();
  });

  it('em votação: painel de votos e sugestões fechadas', async () => {
    await abrir(
      umDetalhe({
        status: 'EM_VOTACAO',
        fimVotacao: '2099-01-20T12:00:00.000Z',
        votos: { likes: 3, dislikes: 1, relevancia: 0.4 },
        permissoes: permissoes({ podeVotar: true }),
      }),
    );
    expect(screen.getByRole('heading', { name: 'Interesse da comunidade' })).toBeInTheDocument();
    expect(screen.getByText('A fase de sugestões terminou.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sua sugestão')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like, 3 votos' })).toBeEnabled();
  });

  it('depois da votação: o painel só aparece se houve votos', async () => {
    const comVotos = await abrir(
      umDetalhe({ status: 'EM_ANALISE', votos: { likes: 2, dislikes: 0, relevancia: 0.3 } }),
    );
    expect(screen.getByRole('heading', { name: 'Interesse da comunidade' })).toBeInTheDocument();
    expect(screen.getByText('Votação encerrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like, 2 votos' })).toBeDisabled();
    comVotos.unmount();

    await abrir(umDetalhe({ status: 'EM_ANALISE' }));
    expect(screen.queryByRole('heading', { name: 'Interesse da comunidade' })).not.toBeInTheDocument();
  });
});

describe('DetalhePage: votar', () => {
  it('vota com atualização otimista e toast', async () => {
    votar.mockResolvedValue({ meuVoto: 1, likes: 4, dislikes: 1, relevancia: 0.5, acao: 'REGISTRADO' });
    await abrir(
      umDetalhe({
        status: 'EM_VOTACAO',
        votos: { likes: 3, dislikes: 1, relevancia: 0.4 },
        permissoes: permissoes({ podeVotar: true }),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Like, 3 votos' }));
    expect(screen.getByRole('button', { name: 'Like, 4 votos' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Voto registrado'));
    expect(votar).toHaveBeenCalledWith('ini-1', 1);
  });

  it('409 ao votar: desfaz, avisa e recarrega o detalhe', async () => {
    votar.mockRejectedValue(new ApiError('A votação desta iniciativa foi encerrada.', 409));
    await abrir(
      umDetalhe({
        status: 'EM_VOTACAO',
        votos: { likes: 3, dislikes: 1, relevancia: 0.4 },
        permissoes: permissoes({ podeVotar: true }),
      }),
    );
    expect(obter).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Dislike, 1 votos' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('A votação desta iniciativa foi encerrada.'),
    );
    await waitFor(() => expect(obter).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Dislike, 1 votos' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('DetalhePage: sugestões', () => {
  it('lista os comentários agrupados por ciclo quando o ciclo atual é maior que 1', async () => {
    listar.mockResolvedValue(
      paginaDeComentarios([
        comentarioDe({ id: 'c2', ciclo: 2, texto: 'Comentário do ciclo 2' }),
        comentarioDe({ id: 'c1', ciclo: 1, texto: 'Comentário do ciclo 1' }),
      ]),
    );
    await abrir(umDetalhe({ ciclo: 2 }));
    expect(await screen.findByText('Ciclo 2 (atual)')).toBeInTheDocument();
    expect(screen.getByText('Ciclo 1 (antes da reprovação)')).toBeInTheDocument();
    expect(screen.getByText('Comentário do ciclo 1')).toBeInTheDocument();
    expect(screen.getByText('2 comentário(s)')).toBeInTheDocument();
  });

  it('envia uma sugestão, mostra o toast, recarrega a lista e limpa a caixa', async () => {
    comentar.mockResolvedValue(comentarioDe({ id: 'novo' }));
    await abrir(umDetalhe());
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: 'Mais cadeiras.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

    await waitFor(() => expect(comentar).toHaveBeenCalledWith('ini-1', 'Mais cadeiras.'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sugestão enviada'));
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByLabelText('Sua sugestão')).toHaveValue(''));
  });

  it('409 ao comentar (fase encerrada): toast, mantém o texto e recarrega o detalhe', async () => {
    comentar.mockRejectedValue(new ApiError('A fase de sugestões terminou.', 409));
    await abrir(umDetalhe());
    fireEvent.change(screen.getByLabelText('Sua sugestão'), { target: { value: 'Tarde demais' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('A fase de sugestões terminou.'));
    await waitFor(() => expect(obter).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText('Sua sugestão')).toHaveValue('Tarde demais');
  });
});

describe('DetalhePage: decisão do comitê', () => {
  const emAnalise = (parcial: Partial<DetalheIniciativa> = {}) =>
    umDetalhe({ status: 'EM_ANALISE', ...parcial });

  it('só aparece para o comitê, com a iniciativa em análise', async () => {
    useMe.mockReturnValue({ me: ME });
    const comum = await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));
    expect(screen.queryByRole('heading', { name: 'Decisão do comitê' })).not.toBeInTheDocument();
    comum.unmount();

    useMe.mockReturnValue({ me: ME_COMITE });
    const comite = await abrir(umDetalhe({ permissoes: permissoes({ podeDecidir: true }) }));
    expect(screen.queryByRole('heading', { name: 'Decisão do comitê' })).not.toBeInTheDocument();
    comite.unmount();

    await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));
    expect(screen.getByRole('heading', { name: 'Decisão do comitê' })).toBeInTheDocument();
  });

  it('autor do comitê: mostra o motivo e bloqueia os botões', async () => {
    const motivo =
      'Você é o autor desta iniciativa e não pode registrar a decisão. Outro membro do comitê deve fazê-lo.';
    useMe.mockReturnValue({ me: ME_COMITE });
    await abrir(
      emAnalise({ permissoes: permissoes({ podeDecidir: false, motivoNaoPodeDecidir: motivo }) }),
    );
    expect(screen.getByText(motivo)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reprovar' })).toBeDisabled();
  });

  it('aprova depois de confirmar, com toast e recarga', async () => {
    decidir.mockResolvedValue(umDetalhe({ status: 'APROVADA' }));
    useMe.mockReturnValue({ me: ME_COMITE });
    await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    expect(await screen.findByText('Registrar a aprovação de "Semana de Tecnologia"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprovação' }));

    await waitFor(() => expect(decidir).toHaveBeenCalledWith('ini-1', { resultado: 'APROVADA', justificativa: undefined }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Iniciativa aprovada'));
    await waitFor(() => expect(obter).toHaveBeenCalledTimes(2));
  });

  it('reprova com justificativa, com toast', async () => {
    decidir.mockResolvedValue(umDetalhe({ status: 'REPROVADA' }));
    useMe.mockReturnValue({ me: ME_COMITE });
    await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));

    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));
    expect(screen.getByText('A justificativa é obrigatória para reprovar.')).toBeInTheDocument();
    expect(decidir).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Justificativa'), { target: { value: 'Faltou orçamento.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));
    await waitFor(() =>
      expect(decidir).toHaveBeenCalledWith('ini-1', {
        resultado: 'REPROVADA',
        justificativa: 'Faltou orçamento.',
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Iniciativa reprovada'));
  });

  it('409 (já decidida): toast com a mensagem e recarrega', async () => {
    decidir.mockRejectedValue(new ApiError('Esta iniciativa já foi decidida.', 409));
    useMe.mockReturnValue({ me: ME_COMITE });
    await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar aprovação' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Esta iniciativa já foi decidida.'));
    await waitFor(() => expect(obter).toHaveBeenCalledTimes(2));
  });

  it('422 de justificativa vindo do servidor aparece na caixa', async () => {
    decidir.mockRejectedValue(
      new ApiError('Dados inválidos', 422, undefined, {
        justificativa: ['A justificativa é obrigatória para reprovar.'],
      }),
    );
    useMe.mockReturnValue({ me: ME_COMITE });
    await abrir(emAnalise({ permissoes: permissoes({ podeDecidir: true }) }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }));
    fireEvent.change(screen.getByLabelText('Justificativa'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }));
    expect(
      await screen.findByText('A justificativa é obrigatória para reprovar.'),
    ).toBeInTheDocument();
  });
});

describe('DetalhePage: acessibilidade', () => {
  it('não tem violações com todos os painéis (comitê, em votação com histórico e comentários)', async () => {
    useMe.mockReturnValue({ me: ME_COMITE });
    listar.mockResolvedValue(
      paginaDeComentarios([
        comentarioDe({ id: 'c2', ciclo: 2 }),
        comentarioDe({ id: 'c1', ciclo: 1 }),
      ]),
    );
    const tela = await abrir(
      umDetalhe({
        status: 'EM_ANALISE',
        ciclo: 2,
        comVotacao: true,
        votos: { likes: 5, dislikes: 1, relevancia: 0.6 },
        permissoes: permissoes({ podeDecidir: true, podeEditar: false }),
      }),
    );
    await screen.findByText('Histórico de status (1)');
    await screen.findByText('Ciclo 2 (atual)');
    expect(await axe(tela.container)).toHaveNoViolations();
  });

  it('não tem violações em andamento (autor, caixa de sugestão) e aprovada', async () => {
    const andamento = await abrir(umDetalhe({ permissoes: permissoes({ podeEditar: true }) }));
    await screen.findByText('Histórico de status (1)');
    expect(await axe(andamento.container)).toHaveNoViolations();
    andamento.unmount();

    const aprovada = await abrir(
      umDetalhe({
        status: 'APROVADA',
        decisao: decisaoDe('APROVADA'),
        googleAgendaUrl: 'https://calendar.google.com/x',
      }),
    );
    expect(await axe(aprovada.container)).toHaveNoViolations();
  });

  it('não tem violações no cartão "Nada por aqui"', async () => {
    obter.mockRejectedValue(new ApiError('Iniciativa não encontrada.', 404));
    const tela = montar();
    await screen.findByRole('heading', { name: 'Nada por aqui' });
    expect(await axe(tela.container)).toHaveNoViolations();
  });
});
