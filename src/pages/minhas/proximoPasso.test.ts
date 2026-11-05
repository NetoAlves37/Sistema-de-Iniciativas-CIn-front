import { describe, expect, it } from 'vitest';
import { resumo } from '../../modules/iniciativas/iniciativas.fixtures';
import { podeEditarNaLista, proximoPasso } from './proximoPasso';

describe('proximoPasso', () => {
  // Datas sem "Z": o instante é interpretado no fuso local e formatado no mesmo fuso.
  const base = { fimRefinamento: '2026-10-25T15:30:00', fimVotacao: '2026-10-28T09:05:00' };

  it('Em andamento: Sugestões até <data>', () => {
    expect(proximoPasso(resumo({ ...base, status: 'EM_ANDAMENTO' }))).toBe(
      'Sugestões até 25/10/2026 15:30',
    );
  });

  it('Em votação: Votação até <data>', () => {
    expect(proximoPasso(resumo({ ...base, status: 'EM_VOTACAO' }))).toBe(
      'Votação até 28/10/2026 09:05',
    );
  });

  it('Em análise: Aguardando o comitê', () => {
    expect(proximoPasso(resumo({ status: 'EM_ANALISE' }))).toBe('Aguardando o comitê');
  });

  it('Aprovada: Aprovada em <data> (ou só "Aprovada" sem a data da decisão)', () => {
    expect(proximoPasso(resumo({ status: 'APROVADA', decididaEm: '2026-10-30T18:00:00' }))).toBe(
      'Aprovada em 30/10/2026 18:00',
    );
    expect(proximoPasso(resumo({ status: 'APROVADA' }))).toBe('Aprovada');
  });

  it('Reprovada: Pode editar e ressubmeter', () => {
    expect(proximoPasso(resumo({ status: 'REPROVADA' }))).toBe('Pode editar e ressubmeter');
  });

  it('só Em andamento e Reprovada podem ser editadas', () => {
    expect(podeEditarNaLista('EM_ANDAMENTO')).toBe(true);
    expect(podeEditarNaLista('REPROVADA')).toBe(true);
    expect(podeEditarNaLista('EM_VOTACAO')).toBe(false);
    expect(podeEditarNaLista('EM_ANALISE')).toBe(false);
    expect(podeEditarNaLista('APROVADA')).toBe(false);
  });
});
