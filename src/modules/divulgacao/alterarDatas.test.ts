import { describe, expect, it } from 'vitest';
import { datasAposArrastar, datasDaOcorrencia, validarDatas } from './alterarDatas';
import { ocorrencia } from './divulgacao.fixtures';

const diaInteiro = {
  ...ocorrencia,
  inicio: '2026-11-10',
  fim: '2026-11-10',
  diaInteiro: true,
};

describe('datasDaOcorrencia', () => {
  it('usa o período da série e as horas da ocorrência', () => {
    expect(datasDaOcorrencia(ocorrencia)).toEqual({
      inicio: '2026-11-10',
      fim: '2026-12-20',
      horaInicio: '14:00',
      horaFim: '16:00',
    });
  });

  it('dia inteiro fica sem horas', () => {
    expect(datasDaOcorrencia(diaInteiro)).toMatchObject({ horaInicio: null, horaFim: null });
  });
});

describe('datasAposArrastar', () => {
  it('arrastar uma ocorrência do meio da série move a série inteira pelos mesmos dias', () => {
    const terceira = { ...ocorrencia, inicio: '2026-11-24T14:00', fim: '2026-11-24T16:00' };
    const datas = datasAposArrastar(terceira, {
      inicio: new Date(2026, 10, 26, 14, 0),
      fim: new Date(2026, 10, 26, 16, 0),
      diaInteiro: false,
    });
    expect(datas).toEqual({
      inicio: '2026-11-12',
      fim: '2026-12-22',
      horaInicio: '14:00',
      horaFim: '16:00',
    });
  });

  it('na grade de horários, as horas passam a ser as do destino', () => {
    const datas = datasAposArrastar(ocorrencia, {
      inicio: new Date(2026, 10, 9, 9, 30),
      fim: new Date(2026, 10, 9, 11, 30),
      diaInteiro: false,
    });
    expect(datas).toEqual({
      inicio: '2026-11-09',
      fim: '2026-12-19',
      horaInicio: '09:30',
      horaFim: '11:30',
    });
  });

  it('de dia inteiro para um horário, sem fim calculado, dura 1 hora', () => {
    const datas = datasAposArrastar(diaInteiro, {
      inicio: new Date(2026, 10, 10, 8, 0),
      fim: null,
      diaInteiro: false,
    });
    expect(datas).toMatchObject({ horaInicio: '08:00', horaFim: '09:00' });
  });

  it('solta em "Dia todo", a iniciativa vira de dia inteiro', () => {
    const datas = datasAposArrastar(ocorrencia, {
      inicio: new Date(2026, 10, 11),
      fim: null,
      diaInteiro: true,
    });
    expect(datas).toEqual({
      inicio: '2026-11-11',
      fim: '2026-12-21',
      horaInicio: null,
      horaFim: null,
    });
  });
});

describe('validarDatas', () => {
  const validas = {
    inicio: '2026-11-10',
    fim: '2026-11-12',
    horaInicio: '09:00',
    horaFim: '10:00',
  };

  it('aceita datas e horários válidos', () => {
    expect(validarDatas(validas)).toEqual({});
    expect(validarDatas({ ...validas, horaInicio: null, horaFim: null })).toEqual({});
  });

  it('usa as mesmas mensagens do backend', () => {
    expect(validarDatas({ ...validas, inicio: '', fim: '' })).toEqual({
      inicio: 'Informe a data de início.',
      fim: 'Informe a data de término.',
    });
    expect(validarDatas({ ...validas, fim: '2026-11-09' })).toEqual({
      fim: 'A data de término deve ser igual ou posterior à de início.',
    });
    expect(validarDatas({ ...validas, horaFim: null })).toEqual({
      horaFim: 'Informe a hora de término ou apague a de início.',
    });
    expect(validarDatas({ ...validas, horaInicio: null })).toEqual({
      horaInicio: 'Informe a hora de início ou apague a de término.',
    });
    expect(validarDatas({ ...validas, horaFim: '09:00' })).toEqual({
      horaFim: 'A hora de término deve ser posterior à de início.',
    });
  });
});
