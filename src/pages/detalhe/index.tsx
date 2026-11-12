import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PainelDecisao, useDecisao } from '../../modules/avaliacao';
import { PERFIL_LABELS, useMe } from '../../modules/identidade';
import {
  CalloutStatus,
  DadosIniciativa,
  HistoricoStatus,
  NadaPorAqui,
  StatusBadge,
  Stepper,
  TipoChip,
  useHistorico,
  useIniciativa,
} from '../../modules/iniciativas';
import {
  BTN_PRIMARIO,
  BTN_SECUNDARIO,
  CLASSE_CARTAO,
  CLASSE_TITULO_SECAO,
} from '../../modules/compartilhado';
import { PainelSugestoes, useComentarios } from '../../modules/refinamento';
import { PainelVotos, painelVotosVisivel, useVoto } from '../../modules/votacao';
import { Links, linkEditar } from '../../utils/enums';

/** `/iniciativas/:id`: situação, dados, decisão do comitê, votos, sugestões e histórico. */
export default function DetalhePage() {
  const { id } = useParams();
  const { iniciativa, isLoading, error, reload } = useIniciativa(id);

  if (!iniciativa) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && !error ? (
          <p role="status" className="text-sm text-gray-700 dark:text-gray-300">
            Carregando…
          </p>
        ) : (
          <NadaPorAqui
            mensagem={error?.message ?? 'Não foi possível carregar a iniciativa.'}
            aoTentarDeNovo={reload}
          />
        )}
      </div>
    );
  }

  return <Detalhe key={iniciativa.id} iniciativa={iniciativa} reload={reload} />;
}

type DetalheProps = {
  iniciativa: NonNullable<ReturnType<typeof useIniciativa>['iniciativa']>;
  reload: () => void;
};

function Detalhe({ iniciativa: it, reload }: DetalheProps) {
  const { me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();

  // Muda quando o status ou o ciclo mudam: recarrega sugestões e histórico.
  const versao = `${it.status}|${it.ciclo}`;
  const { comentarios, comentar, enviando } = useComentarios(it.id, versao, { aoConflito: reload });
  const { transicoes } = useHistorico(it.id, versao);
  const decisao = useDecisao(it.id, { aoDecidir: reload, aoConflito: reload });
  const { estado: votos, votar, carregando: votando } = useVoto(
    it.id,
    { meuVoto: it.meuVoto, ...it.votos },
    { aoConflito: reload },
  );

  const voltar = () => (location.key === 'default' ? navigate(Links.INICIO) : navigate(-1));
  const { permissoes } = it;
  const mostrarDecisao = Boolean(me?.ehComite) && it.status === 'EM_ANALISE';
  const mostrarVotos = painelVotosVisivel(it.status, it.votos.likes + it.votos.dislikes);
  const temAcoes =
    permissoes.podeEditar ||
    permissoes.podeRessubmeter ||
    (it.status === 'APROVADA' && Boolean(it.googleAgendaUrl));

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <h1 className="rounded-full bg-gray-100 px-4 py-1.5 text-lg font-bold break-words text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            {it.titulo}
          </h1>
          <StatusBadge status={it.status} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <TipoChip tipo={it.tipo} />
          <span>
            Proposta por <strong>{it.autor.nome}</strong> ({PERFIL_LABELS[it.autor.perfil]})
          </span>
          {it.ciclo > 1 && <span>Ciclo {it.ciclo}</span>}
          {!it.comVotacao && (
            <span className="rounded-[3px] bg-gray-200 px-2 py-px text-xs font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
              Sem votação
            </span>
          )}
        </p>
      </header>

      <div>
        <Stepper status={it.status} comVotacao={it.comVotacao} />
        <CalloutStatus iniciativa={it} />
      </div>

      {temAcoes && (
        <div className="flex flex-wrap gap-3">
          {permissoes.podeEditar && (
            <Link to={linkEditar(it.id)} className={BTN_PRIMARIO}>
              Editar iniciativa
            </Link>
          )}
          {permissoes.podeRessubmeter && (
            <Link to={linkEditar(it.id)} className={BTN_PRIMARIO}>
              Editar e ressubmeter
            </Link>
          )}
          {it.status === 'APROVADA' && it.googleAgendaUrl && (
            <a
              href={it.googleAgendaUrl}
              target="_blank"
              rel="noopener"
              className={BTN_SECUNDARIO}
            >
              Adicionar ao Google Agenda
            </a>
          )}
        </div>
      )}

      {mostrarDecisao && (
        <PainelDecisao
          titulo={it.titulo}
          podeDecidir={permissoes.podeDecidir}
          motivoNaoPodeDecidir={permissoes.motivoNaoPodeDecidir}
          carregando={decisao.carregando}
          erroJustificativa={decisao.erroJustificativa}
          aoAprovar={decisao.aprovar}
          aoReprovar={decisao.reprovar}
        />
      )}

      <section aria-labelledby="titulo-dados" className={CLASSE_CARTAO}>
        <h2 id="titulo-dados" className={`${CLASSE_TITULO_SECAO} mb-3`}>
          Dados da iniciativa
        </h2>
        <DadosIniciativa iniciativa={it} />
      </section>

      {mostrarVotos && (
        <PainelVotos
          votos={votos}
          emVotacao={it.status === 'EM_VOTACAO'}
          podeVotar={permissoes.podeVotar}
          carregando={votando}
          aoVotar={votar}
        />
      )}

      <PainelSugestoes
        comentarios={comentarios}
        cicloAtual={it.ciclo}
        aberto={it.status === 'EM_ANDAMENTO'}
        enviando={enviando}
        aoEnviar={comentar}
      />

      <section className={CLASSE_CARTAO}>
        <HistoricoStatus transicoes={transicoes} />
      </section>
    </div>
  );
}
