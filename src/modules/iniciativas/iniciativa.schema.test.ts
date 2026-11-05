import { describe, expect, it } from 'vitest';
import {
  iniciativaSchema,
  LIMITES,
  MENSAGENS,
  paraDadosInput,
  VALORES_NOVA,
  valoresDeIniciativa,
  type IniciativaFormValues,
} from './iniciativa.schema';
import type { DetalheIniciativa } from './iniciativas.types';

const valido: IniciativaFormValues = {
  tipo: 'EVENTO',
  titulo: 'Semana de Tecnologia',
  participantes: '50',
  resumo: 'Resumo curto',
  detalhe: 'Descrição detalhada',
  inicio: '2026-11-10',
  fim: '2026-11-12',
  horaInicio: '',
  horaFim: '',
  periodicidade: 'EVENTO_UNICO',
  espaco: 'Auditório do CIn',
  organizadores: 'Ana, Bruno',
  membros: '',
  comVotacao: true,
};

/** Valida e devolve `{ campo: primeira mensagem }`. */
function erros(parcial: Partial<IniciativaFormValues>): Record<string, string> {
  const r = iniciativaSchema.safeParse({ ...valido, ...parcial });
  if (r.success) return {};
  const saida: Record<string, string> = {};
  for (const i of r.error.issues) {
    const campo = String(i.path[0]);
    saida[campo] ??= i.message;
  }
  return saida;
}

describe('iniciativaSchema (RN-01)', () => {
  it('RN-01.1: submissão válida passa', () => {
    expect(iniciativaSchema.safeParse(valido).success).toBe(true);
  });

  it('comVotacao é verdadeiro no formulário em branco', () => {
    expect(VALORES_NOVA.comVotacao).toBe(true);
  });

  it.each([
    ['tipo', '', MENSAGENS.tipo],
    ['titulo', '', 'Informe o título.'],
    ['resumo', '', 'Escreva uma descrição resumida.'],
    ['detalhe', '', 'Escreva a descrição detalhada.'],
    ['inicio', '', 'Informe a data de início.'],
    ['fim', '', 'Informe a data de término.'],
    ['periodicidade', '', 'Selecione a periodicidade.'],
    ['espaco', '', 'Informe o espaço utilizado.'],
    ['organizadores', '', 'Informe ao menos um organizador.'],
    ['participantes', '', 'Informe um número maior que zero.'],
  ] as const)('RN-01.2: %s ausente gera erro só nesse campo', (campo, valor, mensagem) => {
    expect(erros({ [campo]: valor })).toEqual({ [campo]: mensagem });
  });

  it('tipo e periodicidade fora da lista são rejeitados', () => {
    expect(erros({ tipo: 'OUTRO' }).tipo).toBe('Selecione o tipo.');
    expect(erros({ periodicidade: 'ANUAL' }).periodicidade).toBe('Selecione a periodicidade.');
  });

  it.each([
    ['titulo', LIMITES.titulo],
    ['resumo', LIMITES.resumo],
    ['detalhe', LIMITES.detalhe],
    ['espaco', LIMITES.espaco],
    ['organizadores', LIMITES.organizadores],
    ['membros', LIMITES.membros],
  ] as const)('RN-01.3: %s aceita %i caracteres e rejeita +1', (campo, limite) => {
    expect(erros({ [campo]: 'a'.repeat(limite) })).toEqual({});
    expect(erros({ [campo]: 'a'.repeat(limite + 1) })).toEqual({
      [campo]: `Use no máximo ${limite} caracteres.`,
    });
  });

  it('RN-01.3: participantes aceita 1 e 100000 e rejeita 100001', () => {
    expect(erros({ participantes: '1' })).toEqual({});
    expect(erros({ participantes: '100000' })).toEqual({});
    expect(erros({ participantes: '100001' }).participantes).toMatch(/no máximo 100000/);
  });

  it.each(['0', '-3', '1.5', 'abc', ''])('RN-01.4: participantes "%s" é rejeitado', (valor) => {
    expect(erros({ participantes: valor })).toEqual({
      participantes: 'Informe um número maior que zero.',
    });
  });

  it('RN-01.5: strings só com espaços contam como vazias', () => {
    expect(erros({ titulo: '   ', resumo: '\n ', organizadores: '  ' })).toEqual({
      titulo: 'Informe o título.',
      resumo: 'Escreva uma descrição resumida.',
      organizadores: 'Informe ao menos um organizador.',
    });
  });

  it('o limite vale depois do trim', () => {
    expect(erros({ titulo: `  ${'a'.repeat(LIMITES.titulo)}  ` })).toEqual({});
  });

  it('membros é opcional', () => {
    expect(erros({ membros: '' })).toEqual({});
  });
});

describe('iniciativaSchema (RN-02)', () => {
  it('RN-02.1: fim igual ao início passa', () => {
    expect(erros({ inicio: '2026-11-10', fim: '2026-11-10' })).toEqual({});
  });

  it('RN-02.2: fim anterior ao início falha', () => {
    expect(erros({ inicio: '2026-11-10', fim: '2026-11-09' })).toEqual({
      fim: 'A data de término deve ser igual ou posterior à de início.',
    });
  });

  it('RN-02.3: só a hora de início falha', () => {
    expect(erros({ horaInicio: '09:00', horaFim: '' })).toEqual({
      horaFim: 'Informe a hora de término ou apague a de início.',
    });
  });

  it('RN-02.4: só a hora de término falha', () => {
    expect(erros({ horaInicio: '', horaFim: '10:00' })).toEqual({
      horaInicio: 'Informe a hora de início ou apague a de término.',
    });
  });

  it('RN-02.5: hora de término igual ou anterior à de início falha', () => {
    const msg = { horaFim: 'A hora de término deve ser posterior à de início.' };
    expect(erros({ horaInicio: '09:00', horaFim: '09:00' })).toEqual(msg);
    expect(erros({ horaInicio: '09:00', horaFim: '08:59' })).toEqual(msg);
    expect(erros({ horaInicio: '09:00', horaFim: '09:01' })).toEqual({});
  });

  it('RN-02.6: sem horas passa', () => {
    expect(erros({ horaInicio: '', horaFim: '' })).toEqual({});
  });

  it('mostra erros de campo e de regra entre campos ao mesmo tempo', () => {
    expect(erros({ tipo: '', inicio: '2026-11-10', fim: '2026-11-01' })).toEqual({
      tipo: 'Selecione o tipo.',
      fim: 'A data de término deve ser igual ou posterior à de início.',
    });
  });
});

describe('conversões', () => {
  it('paraDadosInput converte número, horas e membros vazios', () => {
    const dados = paraDadosInput({ ...valido, titulo: ' X ', membros: '  ' });
    expect(dados).toMatchObject({
      titulo: 'X',
      participantes: 50,
      horaInicio: null,
      horaFim: null,
      membros: null,
      comVotacao: true,
    });
  });

  it('valoresDeIniciativa preenche o formulário e trata nulos', () => {
    const detalhe = {
      ...valido,
      participantes: 50,
      horaInicio: null,
      horaFim: null,
      membros: null,
    } as unknown as DetalheIniciativa;
    expect(valoresDeIniciativa(detalhe)).toEqual(valido);
  });
});
