import { describe, expect, it } from 'vitest';
import {
  CLASSE_STATUS,
  CLASSE_TIPO,
  PERIODICIDADES,
  ROTULO_PERIODICIDADE,
  ROTULO_STATUS,
  ROTULO_TIPO,
  STATUS_ORDEM,
  TIPOS,
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
    expect(ROTULO_TIPO).toEqual({ EXTENSAO: 'Extensão', PESQUISA: 'Pesquisa', EVENTO: 'Evento' });
    expect(PERIODICIDADES.map((p) => ROTULO_PERIODICIDADE[p])).toEqual([
      'Evento único',
      'Diária',
      'Semanal',
      'Quinzenal',
      'Mensal',
    ]);
  });

  it('cobrem todos os status e tipos com classes de cor', () => {
    for (const status of STATUS_ORDEM) expect(CLASSE_STATUS[status]).toBeTruthy();
    for (const tipo of TIPOS) expect(CLASSE_TIPO[tipo]).toBeTruthy();
  });
});
