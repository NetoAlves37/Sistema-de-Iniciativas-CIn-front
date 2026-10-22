import { describe, expect, it } from 'vitest';
import { lerProblema } from './problem';

const json = (status: number, corpo: object) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });

describe('lerProblema', () => {
  it('lê status, detail e code do Problem Details', async () => {
    const problema = await lerProblema(
      json(409, { status: 409, code: 'CONFLICT', detail: 'Esta iniciativa já foi decidida.' }),
    );
    expect(problema).toEqual({
      status: 409,
      detail: 'Esta iniciativa já foi decidida.',
      code: 'CONFLICT',
      errors: undefined,
    });
  });

  it('traz os erros por campo do 422', async () => {
    const problema = await lerProblema(
      json(422, {
        code: 'VALIDATION_FAILED',
        detail: 'Um ou mais campos precisam ser corrigidos.',
        errors: { titulo: ['Informe o título.'], fim: ['A data de término deve ser igual ou posterior à de início.'] },
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.errors).toEqual({
      titulo: ['Informe o título.'],
      fim: ['A data de término deve ser igual ou posterior à de início.'],
    });
  });

  it('aceita o formato antigo do NestJS ({ message } string ou lista)', async () => {
    expect((await lerProblema(json(400, { message: 'Requisição inválida' }))).detail).toBe(
      'Requisição inválida',
    );
    expect((await lerProblema(json(400, { message: ['a', 'b'] }))).detail).toBe('a, b');
  });

  it('cai para o texto puro quando o corpo não é JSON', async () => {
    const problema = await lerProblema(new Response('Bad Gateway', { status: 502 }));
    expect(problema).toMatchObject({ status: 502, detail: 'Bad Gateway' });
  });

  it('usa a mensagem padrão quando o corpo está vazio', async () => {
    const problema = await lerProblema(new Response('', { status: 500 }), 'Falha ao salvar.');
    expect(problema).toMatchObject({ status: 500, detail: 'Falha ao salvar.' });
  });

  it('não consome o corpo da resposta original', async () => {
    const resposta = json(403, { detail: 'Acesso negado.' });
    await lerProblema(resposta);
    expect(await resposta.json()).toEqual({ detail: 'Acesso negado.' });
  });
});
