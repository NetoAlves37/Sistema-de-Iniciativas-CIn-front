import { useState } from 'react';
import { toast } from '@cincoders/cinnamon';
import { Pencil, Power, RefreshCw, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CLASSE_CARTAO, CLASSE_TITULO_SECAO } from '../../modules/compartilhado';
import {
  FormularioTipo,
  type TipoCadastro,
  TipoChip,
  tiposApi,
  useTipos,
} from '../../modules/iniciativas';

const COR_INICIAL = '#3B82F6';

const BTN_ACAO =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800';

/**
 * Tipos de iniciativa (comitê e ADMIN): cadastrar, renomear, trocar a cor, ativar e desativar
 * e excluir (só sem iniciativas associadas). Toda mudança fica no log de auditoria do banco.
 */
export default function TiposPage() {
  const { todos, carregando, erro, recarregar } = useTipos();
  const [editando, setEditando] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<TipoCadastro | null>(null);
  // Remonta o formulário de cadastro vazio depois de salvar.
  const [chaveNovo, setChaveNovo] = useState(0);

  const cadastrar = async (valores: { nome: string; cor: string }) => {
    const criado = await tiposApi.cadastrar(valores);
    await recarregar();
    setChaveNovo((n) => n + 1);
    toast.success(`Tipo "${criado.nome}" cadastrado.`);
  };

  const salvarEdicao = async (tipo: TipoCadastro, valores: { nome: string; cor: string }) => {
    await tiposApi.alterar(tipo.id, valores);
    await recarregar();
    setEditando(null);
    toast.success('Tipo alterado.');
  };

  const alternarAtivo = async (tipo: TipoCadastro) => {
    try {
      await tiposApi.alterar(tipo.id, { ativo: !tipo.ativo });
      await recarregar();
      toast.success(tipo.ativo ? `"${tipo.nome}" desativado.` : `"${tipo.nome}" ativado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível alterar o tipo.');
    }
  };

  const excluir = async (tipo: TipoCadastro) => {
    try {
      await tiposApi.excluir(tipo.id);
      await recarregar();
      toast.success(`"${tipo.nome}" excluído.`);
    } catch (e) {
      // 409: alguém associou uma iniciativa ao tipo nesse meio-tempo.
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir o tipo.');
      await recarregar();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Tipos de iniciativa
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Os tipos ativos aparecem para escolha ao submeter uma iniciativa. Um tipo com iniciativas
          associadas não pode ser excluído, mas pode ser desativado.
        </p>
      </div>

      <section aria-labelledby="titulo-novo" className={`${CLASSE_CARTAO} mb-8`}>
        <h2 id="titulo-novo" className={`${CLASSE_TITULO_SECAO} mb-4`}>
          Novo tipo
        </h2>
        <FormularioTipo
          key={chaveNovo}
          valoresIniciais={{ nome: '', cor: COR_INICIAL }}
          rotuloEnvio="Cadastrar"
          aoEnviar={cadastrar}
        />
      </section>

      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className={`${CLASSE_TITULO_SECAO} mb-3`}>
          Tipos cadastrados
        </h2>

        <div aria-live="polite">
          {carregando && <p className="py-4 text-gray-600 dark:text-gray-400">Carregando…</p>}
          {!carregando && erro && (
            <div role="alert" className="flex flex-wrap items-center gap-3 py-2">
              <p className="text-red-700 dark:text-red-400">{erro.message}</p>
              <button type="button" onClick={() => void recarregar()} className={BTN_ACAO}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Tentar de novo
              </button>
            </div>
          )}
          {!carregando && !erro && todos.length === 0 && (
            <p className="py-4 text-gray-600 dark:text-gray-400">
              Nenhum tipo cadastrado ainda. Enquanto não houver um tipo ativo, ninguém consegue
              submeter iniciativas.
            </p>
          )}
        </div>

        {todos.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Iniciativas
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Situação
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {todos.map((tipo) =>
                  editando === tipo.id ? (
                    <tr key={tipo.id}>
                      <td colSpan={5} className="px-4 py-3">
                        <FormularioTipo
                          compacto
                          valoresIniciais={{ nome: tipo.nome, cor: tipo.cor }}
                          rotuloEnvio="Salvar"
                          aoEnviar={(valores) => salvarEdicao(tipo, valores)}
                          aoCancelar={() => setEditando(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={tipo.id} className={tipo.ativo ? '' : 'text-gray-500'}>
                      <th scope="row" className="px-4 py-3 font-normal">
                        <TipoChip tipo={tipo.code} />
                      </th>
                      <td className="px-4 py-3 font-mono text-xs">{tipo.code}</td>
                      <td className="px-4 py-3">{tipo.iniciativas}</td>
                      <td className="px-4 py-3">{tipo.ativo ? 'Ativo' : 'Desativado'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditando(tipo.id)}
                            aria-label={`Editar ${tipo.nome}`}
                            className={BTN_ACAO}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void alternarAtivo(tipo)}
                            aria-label={`${tipo.ativo ? 'Desativar' : 'Ativar'} ${tipo.nome}`}
                            className={BTN_ACAO}
                          >
                            <Power className="h-4 w-4" aria-hidden="true" />
                            {tipo.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExcluindo(tipo)}
                            disabled={tipo.iniciativas > 0}
                            aria-label={`Excluir ${tipo.nome}`}
                            title={
                              tipo.iniciativas > 0
                                ? 'Há iniciativas associadas: não pode ser excluído (só desativado).'
                                : undefined
                            }
                            aria-describedby={tipo.iniciativas > 0 ? `em-uso-${tipo.id}` : undefined}
                            className={BTN_ACAO}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Excluir
                          </button>
                          {tipo.iniciativas > 0 && (
                            <span id={`em-uso-${tipo.id}`} className="sr-only">
                              Não pode ser excluído porque há iniciativas associadas.
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={excluindo !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setExcluindo(null);
        }}
        onConfirm={() => {
          if (excluindo) void excluir(excluindo);
          setExcluindo(null);
        }}
        title="Excluir tipo?"
        description={
          excluindo
            ? `O tipo "${excluindo.nome}" será excluído. A exclusão fica registrada no log.`
            : ''
        }
        confirmLabel="Excluir"
      />
    </div>
  );
}
