import { useId, useState } from 'react';
import { toast } from '@cincoders/cinnamon';
import { Loader2 } from 'lucide-react';
import { ApiError } from '../../../services/api';
import { BTN_PRIMARIO, BTN_SECUNDARIO, CLASSE_CAMPO, CLASSE_ERRO } from '../../compartilhado';
import { corDoTexto } from '../cores';

const FORMATO_COR = /^#[0-9A-Fa-f]{6}$/;
const LIMITE_NOME = 60;

export interface ValoresTipo {
  nome: string;
  cor: string;
}

type Erros = Partial<Record<keyof ValoresTipo, string>>;

/** Mesmas regras e mensagens do backend, para avisar antes de enviar. */
export function validarTipo({ nome, cor }: ValoresTipo): Erros {
  const erros: Erros = {};
  if (!nome.trim()) erros.nome = 'Informe o nome do tipo.';
  else if (nome.trim().length > LIMITE_NOME)
    erros.nome = `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`;
  if (!cor.trim()) erros.cor = 'Escolha a cor do tipo.';
  else if (!FORMATO_COR.test(cor.trim())) erros.cor = 'Informe a cor no formato #RRGGBB.';
  return erros;
}

interface FormularioTipoProps {
  valoresIniciais: ValoresTipo;
  rotuloEnvio: string;
  /** Envia. Pode lançar `ApiError`: o 422 vai para os campos; o resto, para um toast. */
  aoEnviar: (valores: ValoresTipo) => Promise<void>;
  aoCancelar?: () => void;
  /** Formulário em linha (edição dentro da tabela): campos lado a lado e rótulos discretos. */
  compacto?: boolean;
}

/**
 * Nome e cor de um tipo de iniciativa, com prévia da etiqueta como ela vai aparecer (a cor
 * do texto é escolhida automaticamente para ficar legível).
 */
export function FormularioTipo({
  valoresIniciais,
  rotuloEnvio,
  aoEnviar,
  aoCancelar,
  compacto = false,
}: FormularioTipoProps) {
  const id = useId();
  const [valores, setValores] = useState<ValoresTipo>(valoresIniciais);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  const corValida = FORMATO_COR.test(valores.cor);
  const mudar = (campo: keyof ValoresTipo, valor: string) => {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const locais = validarTipo(valores);
    if (Object.keys(locais).length > 0) {
      setErros(locais);
      document.getElementById(`${id}-${locais.nome ? 'nome' : 'cor-texto'}`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      await aoEnviar({ nome: valores.nome.trim(), cor: valores.cor.trim().toUpperCase() });
    } catch (erro) {
      const porCampo = erro instanceof ApiError && erro.status === 422 ? erro.fieldErrors : undefined;
      const doServidor: Erros = {
        nome: porCampo?.nome?.[0],
        cor: porCampo?.cor?.[0],
      };
      if (doServidor.nome || doServidor.cor) setErros(doServidor);
      else toast.error(erro instanceof Error ? erro.message : 'Não foi possível salvar o tipo.');
    } finally {
      setEnviando(false);
    }
  };

  const describedBy = (campo: keyof ValoresTipo) =>
    erros[campo] ? `${id}-${campo}-erro` : undefined;
  const rotulo = compacto
    ? 'sr-only'
    : 'mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100';

  return (
    <form
      noValidate
      onSubmit={enviar}
      className={compacto ? 'flex flex-wrap items-start gap-3' : 'grid gap-4 sm:grid-cols-[1fr_auto]'}
    >
      <div className={compacto ? 'min-w-48 flex-1' : ''}>
        <label htmlFor={`${id}-nome`} className={rotulo}>
          Nome
        </label>
        <input
          id={`${id}-nome`}
          value={valores.nome}
          onChange={(e) => mudar('nome', e.target.value)}
          maxLength={LIMITE_NOME}
          placeholder="Por exemplo: Palestra, Liga, Festival"
          aria-invalid={erros.nome ? true : undefined}
          aria-describedby={describedBy('nome')}
          className={CLASSE_CAMPO}
        />
        {erros.nome && (
          <p id={`${id}-nome-erro`} className={CLASSE_ERRO}>
            {erros.nome}
          </p>
        )}
      </div>

      <fieldset>
        <legend className={rotulo}>Cor</legend>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Escolher a cor"
            value={corValida ? valores.cor : '#000000'}
            onChange={(e) => mudar('cor', e.target.value.toUpperCase())}
            className="h-10 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            id={`${id}-cor-texto`}
            aria-label="Cor em hexadecimal"
            value={valores.cor}
            onChange={(e) => mudar('cor', e.target.value)}
            maxLength={7}
            placeholder="#RRGGBB"
            aria-invalid={erros.cor ? true : undefined}
            aria-describedby={describedBy('cor')}
            className={`${CLASSE_CAMPO} w-28 font-mono`}
          />
          <span
            aria-hidden="true"
            className="inline-block rounded-[3px] px-2 py-px text-[0.78rem] font-semibold whitespace-nowrap"
            style={
              corValida
                ? { backgroundColor: valores.cor, color: corDoTexto(valores.cor) }
                : { border: '1px dashed currentColor' }
            }
          >
            {valores.nome.trim() || 'Prévia'}
          </span>
        </div>
        {erros.cor && (
          <p id={`${id}-cor-erro`} className={CLASSE_ERRO}>
            {erros.cor}
          </p>
        )}
      </fieldset>

      <div className={compacto ? 'flex gap-2' : 'flex gap-2 sm:col-span-2'}>
        <button type="submit" disabled={enviando} className={BTN_PRIMARIO}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {rotuloEnvio}
        </button>
        {aoCancelar && (
          <button type="button" onClick={aoCancelar} disabled={enviando} className={BTN_SECUNDARIO}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
