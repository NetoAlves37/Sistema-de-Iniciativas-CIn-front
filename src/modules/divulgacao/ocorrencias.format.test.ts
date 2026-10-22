import { describe, expect, it } from 'vitest';
import { ocorrencia } from './divulgacao.fixtures';
import { quandoDaOcorrencia, repeticaoDaOcorrencia } from './ocorrencias.format';

describe('quandoDaOcorrencia', () => {
  it('com horário: dia da semana, dia, mês e faixa de horas', () => {
    expect(quandoDaOcorrencia(ocorrencia)).toBe('terça-feira, 10 de novembro, 14:00 às 16:00');
  });

  it('dia inteiro: termina com "dia todo"', () => {
    expect(
      quandoDaOcorrencia({
        ...ocorrencia,
        diaInteiro: true,
        inicio: '2026-11-10',
        fim: '2026-11-11',
      }),
    ).toBe('terça-feira, 10 de novembro, dia todo');
  });

  it('evento único de vários dias, sem horário: mostra o período inteiro', () => {
    expect(
      quandoDaOcorrencia({
        ...ocorrencia,
        periodicidade: 'EVENTO_UNICO',
        diaInteiro: true,
        inicio: '2026-11-10',
        fim: '2026-11-13',
        periodoInicio: '2026-11-10',
        periodoFim: '2026-11-12',
      }),
    ).toBe('10/11/2026 a 12/11/2026, dia todo');
  });
});

describe('repeticaoDaOcorrencia', () => {
  it('mostra a periodicidade e "até <data>" quando o período tem mais de um dia', () => {
    expect(repeticaoDaOcorrencia(ocorrencia)).toBe('Semanal, até 20/12/2026');
  });

  it('omite o "até" quando o período é de um dia só', () => {
    expect(
      repeticaoDaOcorrencia({
        ...ocorrencia,
        periodicidade: 'EVENTO_UNICO',
        periodoFim: ocorrencia.periodoInicio,
      }),
    ).toBe('Evento único');
  });
});
