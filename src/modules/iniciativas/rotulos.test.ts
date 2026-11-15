import { describe, expect, it } from 'vitest';
import {
  CLASSE_STATUS,
  PERIODICIDADES,
  ROTULO_PERIODICIDADE,
  ROTULO_STATUS,
  STATUS_ORDEM,
} from './rotulos';

describe('rótulos', () => {
  it('têm exatamente os textos do protótipo', () => {
    expect(ROTULO_STATUS).toEqual({
      EM_ANDAMENTO: 'Em andamento',
      EM_VOTACAO: 'Em votação',
      EM_ANALISE: 'Em análise',
      APROVADA: 'Aprovada',
      REPROVADA: 'Reprovada',
    });
    expect(PERIODICIDADES.map((p) => ROTULO_PERIODICIDADE[p])).toEqual([
      'Evento único',
      'Diária',
      'Semanal',
      'Quinzenal',
      'Mensal',
    ]);
  });

  it('cobrem todos os status com classes de cor', () => {
    for (const status of STATUS_ORDEM) expect(CLASSE_STATUS[status]).toBeTruthy();
  });
});
