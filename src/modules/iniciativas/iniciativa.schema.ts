import { z } from 'zod';
import type { DadosIniciativaInput, DetalheIniciativa, TipoIniciativa } from './iniciativas.types';
import { PERIODICIDADES, TIPOS } from './rotulos';

/** Limites de tamanho (RN-01), depois do trim. */
export const LIMITES = {
  titulo: 120,
  resumo: 280,
  detalhe: 5000,
  espaco: 200,
  organizadores: 500,
  membros: 500,
  participantesMin: 1,
  participantesMax: 100000,
} as const;

/** Mensagens de erro (RN-01 e RN-02), iguais às do protótipo. */
export const MENSAGENS = {
  tipo: 'Selecione o tipo.',
  titulo: 'Informe o título.',
  resumo: 'Escreva uma descrição resumida.',
  detalhe: 'Escreva a descrição detalhada.',
  inicio: 'Informe a data de início.',
  fim: 'Informe a data de término.',
  periodicidade: 'Selecione a periodicidade.',
  espaco: 'Informe o espaço utilizado.',
  organizadores: 'Informe ao menos um organizador.',
  participantes: 'Informe um número maior que zero.',
  fimAntesDoInicio: 'A data de término deve ser igual ou posterior à de início.',
  horaFimFaltando: 'Informe a hora de término ou apague a de início.',
  horaInicioFaltando: 'Informe a hora de início ou apague a de término.',
  horaFimNaoPosterior: 'A hora de término deve ser posterior à de início.',
} as const;

const excede = (limite: number) => `Use no máximo ${limite} caracteres.`;

const textoObrigatorio = (mensagem: string, limite: number) =>
  z.string().trim().min(1, mensagem).max(limite, excede(limite));

/**
 * Valores do formulário: tudo é texto (como nos inputs), exceto `comVotacao`. Os campos
 * simples nunca abortam a validação, então as regras entre campos (RN-02) aparecem junto
 * com as demais e o usuário vê todos os erros de uma vez.
 */
export const iniciativaSchema = z
  .object({
    tipo: z.string().refine((v) => (TIPOS as string[]).includes(v), MENSAGENS.tipo),
    titulo: textoObrigatorio(MENSAGENS.titulo, LIMITES.titulo),
    participantes: z.string().trim().superRefine((valor, ctx) => {
      const n = /^\d+$/.test(valor) ? Number(valor) : Number.NaN;
      if (!(n >= LIMITES.participantesMin)) {
        ctx.addIssue({ code: 'custom', message: MENSAGENS.participantes });
      } else if (n > LIMITES.participantesMax) {
        ctx.addIssue({
          code: 'custom',
          message: `Informe no máximo ${LIMITES.participantesMax} participantes.`,
        });
      }
    }),
    resumo: textoObrigatorio(MENSAGENS.resumo, LIMITES.resumo),
    detalhe: textoObrigatorio(MENSAGENS.detalhe, LIMITES.detalhe),
    inicio: z.string().trim().min(1, MENSAGENS.inicio),
    fim: z.string().trim().min(1, MENSAGENS.fim),
    horaInicio: z.string().trim(),
    horaFim: z.string().trim(),
    periodicidade: z
      .string()
      .refine((v) => (PERIODICIDADES as string[]).includes(v), MENSAGENS.periodicidade),
    espaco: textoObrigatorio(MENSAGENS.espaco, LIMITES.espaco),
    organizadores: textoObrigatorio(MENSAGENS.organizadores, LIMITES.organizadores),
    membros: z.string().trim().max(LIMITES.membros, excede(LIMITES.membros)),
    comVotacao: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.inicio && v.fim && v.fim < v.inicio) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: MENSAGENS.fimAntesDoInicio });
    }
    if (v.horaInicio && !v.horaFim) {
      ctx.addIssue({ code: 'custom', path: ['horaFim'], message: MENSAGENS.horaFimFaltando });
    }
    if (!v.horaInicio && v.horaFim) {
      ctx.addIssue({ code: 'custom', path: ['horaInicio'], message: MENSAGENS.horaInicioFaltando });
    }
    if (v.horaInicio && v.horaFim && v.horaFim <= v.horaInicio) {
      ctx.addIssue({ code: 'custom', path: ['horaFim'], message: MENSAGENS.horaFimNaoPosterior });
    }
  });

export type IniciativaFormValues = z.infer<typeof iniciativaSchema>;

/** Campos do formulário, na ordem em que aparecem na tela. */
export const CAMPOS_FORM = [
  'tipo',
  'titulo',
  'participantes',
  'resumo',
  'detalhe',
  'inicio',
  'fim',
  'horaInicio',
  'horaFim',
  'periodicidade',
  'espaco',
  'organizadores',
  'membros',
  'comVotacao',
] as const satisfies ReadonlyArray<keyof IniciativaFormValues>;

/** Formulário em branco: a votação geral vem marcada (HU-26). */
export const VALORES_NOVA: IniciativaFormValues = {
  tipo: '',
  titulo: '',
  participantes: '',
  resumo: '',
  detalhe: '',
  inicio: '',
  fim: '',
  horaInicio: '',
  horaFim: '',
  periodicidade: '',
  espaco: '',
  organizadores: '',
  membros: '',
  comVotacao: true,
};

/** Preenche o formulário a partir de uma iniciativa existente (edição e ressubmissão). */
export function valoresDeIniciativa(d: DetalheIniciativa): IniciativaFormValues {
  return {
    tipo: d.tipo,
    titulo: d.titulo,
    participantes: String(d.participantes),
    resumo: d.resumo,
    detalhe: d.detalhe,
    inicio: d.inicio,
    fim: d.fim,
    horaInicio: d.horaInicio ?? '',
    horaFim: d.horaFim ?? '',
    periodicidade: d.periodicidade,
    espaco: d.espaco,
    organizadores: d.organizadores,
    membros: d.membros ?? '',
    comVotacao: d.comVotacao,
  };
}

/** Converte os valores validados no corpo da API (números, horas e membros vazios como `null`). */
export function paraDadosInput(v: IniciativaFormValues): DadosIniciativaInput {
  return {
    tipo: v.tipo as TipoIniciativa,
    titulo: v.titulo.trim(),
    resumo: v.resumo.trim(),
    detalhe: v.detalhe.trim(),
    inicio: v.inicio,
    fim: v.fim,
    horaInicio: v.horaInicio || null,
    horaFim: v.horaFim || null,
    periodicidade: v.periodicidade as DadosIniciativaInput['periodicidade'],
    espaco: v.espaco.trim(),
    organizadores: v.organizadores.trim(),
    membros: v.membros.trim() || null,
    participantes: Number(v.participantes),
    comVotacao: v.comVotacao,
  };
}
