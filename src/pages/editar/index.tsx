import { toast } from '@cincoders/cinnamon';
import { useNavigate, useParams } from 'react-router-dom';
import { useMe } from '../../modules/identidade';
import {
  type DadosIniciativaInput,
  Destaque,
  type DetalheIniciativa,
  IniciativaForm,
  NadaPorAqui,
  ROTULO_STATUS,
  useAtualizarIniciativa,
  useIniciativa,
  useRessubmeterIniciativa,
  valoresDeIniciativa,
} from '../../modules/iniciativas';
import { restanteAte } from '../../modules/compartilhado';
import { ApiError } from '../../services/api';
import { linkDetalhe } from '../../utils/enums';

/** `/iniciativas/:id/editar`: edição (Em andamento) ou edição com ressubmissão (Reprovada). */
export default function EditarPage() {
  const { id = '' } = useParams();
  // Sem recarga automática: ela não deve mexer na tela enquanto o autor digita.
  const { iniciativa, isLoading, error, reload } = useIniciativa(id, { atualizarAuto: false });
  const { me } = useMe();

  if (!iniciativa) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
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

  const { podeEditar, podeRessubmeter } = iniciativa.permissoes;
  if (!podeEditar && !podeRessubmeter) {
    const naoEhAutor = me !== undefined && me.id !== iniciativa.autor.id;
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <NadaPorAqui
          mensagem={
            naoEhAutor
              ? 'Só o autor pode editar esta iniciativa.'
              : `Iniciativas com status "${ROTULO_STATUS[iniciativa.status]}" não podem ser editadas.`
          }
        />
      </div>
    );
  }

  return (
    <FormularioEdicao
      key={iniciativa.id}
      iniciativa={iniciativa}
      ressubmeter={podeRessubmeter}
      reload={reload}
    />
  );
}

interface FormularioEdicaoProps {
  iniciativa: DetalheIniciativa;
  ressubmeter: boolean;
  reload: () => void;
}

function FormularioEdicao({ iniciativa, ressubmeter, reload }: FormularioEdicaoProps) {
  const navigate = useNavigate();
  const atualizar = useAtualizarIniciativa(iniciativa.id);
  const reenviar = useRessubmeterIniciativa(iniciativa.id);

  const aoEnviar = async (dados: DadosIniciativaInput) => {
    if (ressubmeter) {
      await reenviar.executar(dados);
      toast.success('Iniciativa ressubmetida e aberta a sugestões');
    } else {
      await atualizar.executar(dados);
      toast.success('Alterações salvas');
    }
    navigate(linkDetalhe(iniciativa.id));
  };

  // 403 e 409 (já não pode editar, prazo vencido): avisa e recarrega as permissões.
  const aoFalhar = (e: unknown) => {
    toast.error(e instanceof Error ? e.message : 'Não foi possível concluir a operação.');
    if (e instanceof ApiError && (e.status === 403 || e.status === 409)) reload();
  };

  const restante = restanteAte(iniciativa.fimRefinamento);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <IniciativaForm
        titulo={ressubmeter ? 'Editar e ressubmeter' : 'Editar iniciativa'}
        introducao={
          ressubmeter
            ? 'Todos os campos já vêm preenchidos. Ao ressubmeter, a iniciativa volta para sugestões e votação, com a contagem de votos zerada.'
            : `Você pode editar até o fim do refinamento (${restante ?? '—'} restantes). Na votação, a edição é bloqueada.`
        }
        destaque={
          ressubmeter ? (
            <Destaque>
              <p>
                <strong>Justificativa do comitê</strong>
              </p>
              <p>{iniciativa.ultimaJustificativa}</p>
            </Destaque>
          ) : undefined
        }
        valoresIniciais={valoresDeIniciativa(iniciativa)}
        rotuloEnvio={ressubmeter ? 'Ressubmeter iniciativa' : 'Salvar alterações'}
        hrefCancelar={linkDetalhe(iniciativa.id)}
        aoEnviar={aoEnviar}
        aoFalhar={aoFalhar}
      />
    </div>
  );
}
