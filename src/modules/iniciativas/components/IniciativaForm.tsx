import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@cincoders/cinnamon';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../services/api';
import {
  CAMPOS_FORM,
  iniciativaSchema,
  LIMITES,
  paraDadosInput,
  VALORES_NOVA,
  type IniciativaFormValues,
} from '../iniciativa.schema';
import { BTN_PRIMARIO, BTN_SECUNDARIO, CLASSE_AJUDA, CLASSE_CAMPO, CLASSE_ERRO } from '../../compartilhado/estilos';
import type { DadosIniciativaInput } from '../iniciativas.types';
import { PERIODICIDADES, ROTULO_PERIODICIDADE, ROTULO_TIPO, TIPOS } from '../rotulos';

export const MENSAGEM_REVISE = 'Revise os campos destacados.';

type NomeCampo = FieldPath<IniciativaFormValues>;

interface IniciativaFormProps {
  /** Título da página (`h1`). */
  titulo: string;
  /** Texto de apoio abaixo do título; pode depender da escolha de votação. */
  introducao?: ReactNode | ((comVotacao: boolean) => ReactNode);
  /** Conteúdo entre a introdução e o formulário (por exemplo, a justificativa do comitê). */
  destaque?: ReactNode;
  valoresIniciais?: IniciativaFormValues;
  rotuloEnvio: string;
  /** Envia os dados. Pode lançar `ApiError`: o 422 preenche os campos; o resto vai a `aoFalhar`. */
  aoEnviar: (dados: DadosIniciativaInput) => Promise<void>;
  /** Falha que não é de validação de campo (403, 409, rede...). Sem isto, mostra um toast. */
  aoFalhar?: (erro: unknown) => void;
  /** Mostra o botão "Cancelar" apontando para este endereço. */
  hrefCancelar?: string;
}

interface CampoProps {
  nome: NomeCampo;
  rotulo: string;
  opcional?: boolean;
  ajuda?: string;
  largura?: 'normal' | 'largo';
  /** Várias entradas num só campo (datas e horas): rotula com `fieldset`. */
  agrupado?: boolean;
  children: ReactNode;
}

const LARGURA = { normal: '', largo: 'md:col-span-2' } as const;

function Campo({ nome, rotulo, opcional, ajuda, largura = 'normal', agrupado, children }: CampoProps) {
  const conteudo = (
    <>
      {children}
      {ajuda && (
        <p id={`f-${nome}-ajuda`} className={CLASSE_AJUDA}>
          {ajuda}
        </p>
      )}
    </>
  );
  const sufixo = opcional && <span className="font-normal text-gray-600 dark:text-gray-400"> (opcional)</span>;
  const estiloRotulo = 'mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100';

  return (
    <div className={LARGURA[largura]}>
      {agrupado ? (
        <fieldset>
          <legend className={estiloRotulo}>
            {rotulo}
            {sufixo}
          </legend>
          {conteudo}
        </fieldset>
      ) : (
        <>
          <label htmlFor={`f-${nome}`} className={estiloRotulo}>
            {rotulo}
            {sufixo}
          </label>
          {conteudo}
        </>
      )}
    </div>
  );
}

/**
 * Formulário de iniciativa (submissão, edição e ressubmissão). Valida no cliente com o
 * schema zod (RN-01 e RN-02), leva o foco ao primeiro campo inválido e mostra no campo os
 * erros 422 devolvidos pelo servidor.
 */
export function IniciativaForm({
  titulo,
  introducao,
  destaque,
  valoresIniciais,
  rotuloEnvio,
  aoEnviar,
  aoFalhar,
  hrefCancelar,
}: IniciativaFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IniciativaFormValues>({
    resolver: zodResolver(iniciativaSchema),
    defaultValues: valoresIniciais ?? VALORES_NOVA,
  });

  const comVotacao = useWatch({ control, name: 'comVotacao' });

  /** `ajuda` é o id do texto de apoio (quando existe); o erro é ligado automaticamente. */
  const aria = (nome: NomeCampo, ajuda?: string) => {
    const descricao = [ajuda ?? null, errors[nome] ? `f-${nome}-erro` : null]
      .filter(Boolean)
      .join(' ');
    return {
      id: `f-${nome}`,
      'aria-invalid': errors[nome] ? (true as const) : undefined,
      'aria-describedby': descricao || undefined,
    };
  };

  const erro = (nome: NomeCampo) =>
    errors[nome]?.message ? (
      <p id={`f-${nome}-erro`} className={CLASSE_ERRO}>
        {errors[nome]?.message}
      </p>
    ) : null;

  const aoInvalido = () => {
    toast.error(MENSAGEM_REVISE);
  };

  const aoValido = async (valores: IniciativaFormValues) => {
    try {
      await aoEnviar(paraDadosInput(valores));
    } catch (e) {
      const porCampo = e instanceof ApiError && e.status === 422 ? e.fieldErrors : undefined;
      const mapeados = CAMPOS_FORM.filter((campo) => porCampo?.[campo]?.length);
      if (porCampo && mapeados.length > 0) {
        for (const campo of mapeados) {
          setError(campo, { type: 'server', message: porCampo[campo][0] });
        }
        setFocus(mapeados[0]);
        toast.error(MENSAGEM_REVISE);
        return;
      }
      if (aoFalhar) aoFalhar(e);
      else toast.error(e instanceof Error ? e.message : 'Não foi possível concluir a operação.');
    }
  };

  const intro = typeof introducao === 'function' ? introducao(comVotacao) : introducao;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {titulo}
        </h1>
        {intro && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{intro}</p>}
      </div>
      {destaque}

      <form
        noValidate
        onSubmit={handleSubmit(aoValido, aoInvalido)}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-4">
          <Campo nome="tipo" rotulo="Tipo">
            <select {...register('tipo')} {...aria('tipo')} className={CLASSE_CAMPO}>
              <option value="">Selecione</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {ROTULO_TIPO[t]}
                </option>
              ))}
            </select>
            {erro('tipo')}
          </Campo>

          <Campo nome="titulo" rotulo="Título" largura="largo">
            <input
              {...register('titulo')}
              {...aria('titulo')}
              maxLength={LIMITES.titulo}
              className={CLASSE_CAMPO}
            />
            {erro('titulo')}
          </Campo>

          <Campo nome="participantes" rotulo="Quantidade de participantes">
            <input
              {...register('participantes')}
              {...aria('participantes')}
              type="number"
              min={LIMITES.participantesMin}
              max={LIMITES.participantesMax}
              className={CLASSE_CAMPO}
            />
            {erro('participantes')}
          </Campo>

          <Campo
            nome="resumo"
            rotulo="Descrição resumida"
            largura="largo"
            ajuda="Até 280 caracteres. Aparece nas listas."
          >
            <textarea
              {...register('resumo')}
              {...aria('resumo', 'f-resumo-ajuda')}
              rows={3}
              maxLength={LIMITES.resumo}
              className={CLASSE_CAMPO}
            />
            {erro('resumo')}
          </Campo>

          <Campo nome="detalhe" rotulo="Descrição detalhada" largura="largo">
            <textarea
              {...register('detalhe')}
              {...aria('detalhe')}
              rows={5}
              maxLength={LIMITES.detalhe}
              className={CLASSE_CAMPO}
            />
            {erro('detalhe')}
          </Campo>

          <Campo nome="inicio" rotulo="Período" largura="largo" agrupado ajuda="Início e término">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register('inicio')}
                  {...aria('inicio', 'f-inicio-ajuda')}
                  aria-label="Data de início"
                  type="date"
                  className={CLASSE_CAMPO}
                />
                {erro('inicio')}
              </div>
              <div>
                <input
                  {...register('fim')}
                  {...aria('fim', 'f-inicio-ajuda')}
                  aria-label="Data de término"
                  type="date"
                  className={CLASSE_CAMPO}
                />
                {erro('fim')}
              </div>
            </div>
          </Campo>

          <Campo
            nome="horaInicio"
            rotulo="Horário"
            opcional
            largura="largo"
            agrupado
            ajuda="Sem horário, a iniciativa aparece como dia inteiro no calendário."
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register('horaInicio')}
                  {...aria('horaInicio', 'f-horaInicio-ajuda')}
                  aria-label="Hora de início"
                  type="time"
                  className={CLASSE_CAMPO}
                />
                {erro('horaInicio')}
              </div>
              <div>
                <input
                  {...register('horaFim')}
                  {...aria('horaFim', 'f-horaInicio-ajuda')}
                  aria-label="Hora de término"
                  type="time"
                  className={CLASSE_CAMPO}
                />
                {erro('horaFim')}
              </div>
            </div>
          </Campo>

          <Campo nome="periodicidade" rotulo="Periodicidade">
            <select
              {...register('periodicidade')}
              {...aria('periodicidade')}
              className={CLASSE_CAMPO}
            >
              <option value="">Selecione</option>
              {PERIODICIDADES.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_PERIODICIDADE[p]}
                </option>
              ))}
            </select>
            {erro('periodicidade')}
          </Campo>

          <Campo nome="espaco" rotulo="Espaço utilizado">
            <input
              {...register('espaco')}
              {...aria('espaco')}
              maxLength={LIMITES.espaco}
              placeholder="Ex.: Auditório do CIn"
              className={CLASSE_CAMPO}
            />
            {erro('espaco')}
          </Campo>

          <Campo nome="organizadores" rotulo="Organizadores" largura="largo">
            <input
              {...register('organizadores')}
              {...aria('organizadores')}
              maxLength={LIMITES.organizadores}
              placeholder="Nomes separados por vírgula"
              className={CLASSE_CAMPO}
            />
            {erro('organizadores')}
          </Campo>

          <Campo nome="membros" rotulo="Membros" opcional largura="largo">
            <input
              {...register('membros')}
              {...aria('membros')}
              maxLength={LIMITES.membros}
              placeholder="Nomes separados por vírgula"
              className={CLASSE_CAMPO}
            />
            {erro('membros')}
          </Campo>

          <div className="md:col-span-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <input
                {...register('comVotacao')}
                {...aria('comVotacao', 'f-comVotacao-ajuda')}
                type="checkbox"
                className="mt-0.5 h-4 w-4 cursor-pointer accent-red-700"
              />
              Enviar para votação geral (tela de like e dislike)
            </label>
            <p id="f-comVotacao-ajuda" className={`${CLASSE_AJUDA} ml-7`}>
              Se desmarcar, a iniciativa vai direto para o comitê ao fim do prazo de sugestões, sem
              votação.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          {hrefCancelar && (
            <Link to={hrefCancelar} className={BTN_SECUNDARIO}>
              Cancelar
            </Link>
          )}
          <button type="submit" disabled={isSubmitting} className={BTN_PRIMARIO}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {rotuloEnvio}
          </button>
        </div>
      </form>
    </div>
  );
}
