import { describe, expect, it } from 'vitest';
import { montarQuery } from './query';

describe('montarQuery', () => {
  it('ignora vazios e monta a string', () => {
    expect(montarQuery({ status: 'EM_VOTACAO', q: '', tipo: undefined, page: 2, x: null })).toBe(
      '?status=EM_VOTACAO&page=2',
    );
  });

  it('devolve texto vazio sem parâmetros', () => {
    expect(montarQuery({})).toBe('');
    expect(montarQuery({ q: undefined })).toBe('');
  });

  it('arrays viram lista separada por vírgula, e lista vazia some', () => {
    expect(montarQuery({ tipos: ['EVENTO', 'PESQUISA'] })).toBe('?tipos=EVENTO%2CPESQUISA');
    expect(montarQuery({ tipos: [] })).toBe('');
  });

  it('codifica caracteres especiais e preserva false e 0', () => {
    expect(montarQuery({ q: 'a b&c', minhas: false, page: 0 })).toBe('?q=a+b%26c&minhas=false&page=0');
  });
});
