import { describe, expect, it } from 'vitest';
import { fmtDia, fmtPeriodo, fmtRem, restanteAte } from './prazo';

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

describe('fmtRem', () => {
  it('"encerrado" quando o prazo já passou ou é agora', () => {
    expect(fmtRem(0)).toBe('encerrado');
    expect(fmtRem(-5 * MIN)).toBe('encerrado');
  });

  it('dias e horas quando há pelo menos 1 dia', () => {
    expect(fmtRem(2 * D + 3 * H + 40 * MIN)).toBe('2d 3h');
    expect(fmtRem(D)).toBe('1d 0h');
  });

  it('horas e minutos quando há pelo menos 1 hora', () => {
    expect(fmtRem(5 * H + 30 * MIN)).toBe('5h 30min');
    expect(fmtRem(H)).toBe('1h 0min');
  });

  it('minutos, com no mínimo 1min', () => {
    expect(fmtRem(42 * MIN)).toBe('42min');
    expect(fmtRem(20_000)).toBe('1min');
    expect(fmtRem(1)).toBe('1min');
  });
});

describe('restanteAte', () => {
  it('calcula a partir do instante informado', () => {
    const agora = new Date('2026-11-02T12:00:00.000Z').getTime();
    expect(restanteAte('2026-11-03T15:00:00.000Z', agora)).toBe('1d 3h');
    expect(restanteAte('2026-11-02T11:00:00.000Z', agora)).toBe('encerrado');
  });

  it('devolve null sem prazo', () => {
    expect(restanteAte(null)).toBeNull();
  });
});

describe('datas', () => {
  it('fmtDia formata YYYY-MM-DD como dd/mm/aaaa, sem deslocar por fuso', () => {
    expect(fmtDia('2026-12-01')).toBe('01/12/2026');
    expect(fmtDia('2026-12-01T00:00:00.000Z')).toBe('01/12/2026');
    expect(fmtDia(null)).toBe('—');
  });

  it('fmtPeriodo usa uma data só quando início e fim coincidem', () => {
    expect(fmtPeriodo('2026-11-10', '2026-11-10')).toBe('10/11/2026');
    expect(fmtPeriodo('2026-11-10', '2026-12-20')).toBe('10/11/2026 a 20/12/2026');
  });
});
