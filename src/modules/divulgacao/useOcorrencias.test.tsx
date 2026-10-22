import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ocorrencia } from './divulgacao.fixtures';
import {
  intervaloDeDatas,
  ocorrenciaParaEvento,
  useOcorrencias,
  type FiltroCalendario,
} from './useOcorrencias';

const mockOcorrencias = vi.fn();
vi.mock('./divulgacao.api', () => ({
  divulgacaoApi: { ocorrencias: (...args: unknown[]) => mockOcorrencias(...args) },
}));

describe('ocorrenciaParaEvento', () => {
  it('converte uma ocorrência com horário', () => {
    const evento = ocorrenciaParaEvento(ocorrencia);
    expect(evento).toMatchObject({
      title: 'Semana de Boas-Vindas',
      start: '2026-11-10T14:00',
      end: '2026-11-10T16:00',
      allDay: false,
      classNames: ['fc-tp-evt'],
    });
    expect(evento.extendedProps?.ocorrencia).toBe(ocorrencia);
  });

  it('mantém o fim exclusivo das ocorrências de dia inteiro e usa a cor do tipo', () => {
    const evento = ocorrenciaParaEvento({
      ...ocorrencia,
      tipo: 'PESQUISA',
      diaInteiro: true,
      inicio: '2026-11-10',
      fim: '2026-11-11',
    });
    expect(evento).toMatchObject({
      start: '2026-11-10',
      end: '2026-11-11',
      allDay: true,
      classNames: ['fc-tp-pes'],
    });
  });

  it('gera ids diferentes para dias diferentes da mesma iniciativa', () => {
    const a = ocorrenciaParaEvento(ocorrencia);
    const b = ocorrenciaParaEvento({ ...ocorrencia, inicio: '2026-11-17T14:00' });
    expect(a.id).not.toBe(b.id);
  });

  it('usa a cor de extensão', () => {
    expect(ocorrenciaParaEvento({ ...ocorrencia, tipo: 'EXTENSAO' }).classNames).toEqual([
      'fc-tp-ext',
    ]);
  });
});

describe('intervaloDeDatas', () => {
  it('formata o intervalo visível em yyyy-MM-dd (fim exclusivo, como o FullCalendar)', () => {
    expect(intervaloDeDatas(new Date(2026, 9, 25), new Date(2026, 10, 29))).toEqual({
      de: '2026-10-25',
      ate: '2026-11-29',
    });
  });
});

describe('useOcorrencias', () => {
  const base: FiltroCalendario = {
    intervalo: { de: '2026-11-01', ate: '2026-12-06' },
    tipos: ['EXTENSAO', 'PESQUISA', 'EVENTO'],
    minhas: false,
  };

  beforeEach(() => {
    mockOcorrencias.mockReset();
    mockOcorrencias.mockResolvedValue([ocorrencia]);
  });

  it('não chama a API enquanto não há intervalo', async () => {
    const { result } = renderHook(() => useOcorrencias({ ...base, intervalo: null }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockOcorrencias).not.toHaveBeenCalled();
    expect(result.current.ocorrencias).toEqual([]);
  });

  it('busca o intervalo; com todos os tipos marcados não filtra por tipo', async () => {
    const { result } = renderHook(() => useOcorrencias(base));
    await waitFor(() => expect(result.current.ocorrencias).toHaveLength(1));
    expect(mockOcorrencias).toHaveBeenCalledWith({
      de: '2026-11-01',
      ate: '2026-12-06',
      tipos: undefined,
      minhas: undefined,
    });
  });

  it('refaz a busca ao desmarcar um tipo e ao marcar "só as minhas"', async () => {
    const { result, rerender } = renderHook((f: FiltroCalendario) => useOcorrencias(f), {
      initialProps: base,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ ...base, tipos: ['EVENTO', 'PESQUISA'] });
    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith({
        de: '2026-11-01',
        ate: '2026-12-06',
        tipos: ['EVENTO', 'PESQUISA'],
        minhas: undefined,
      }),
    );

    rerender({ ...base, tipos: ['EVENTO', 'PESQUISA'], minhas: true });
    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith(expect.objectContaining({ minhas: true })),
    );
    expect(mockOcorrencias).toHaveBeenCalledTimes(3);
  });

  it('refaz a busca quando o intervalo muda', async () => {
    const { result, rerender } = renderHook((f: FiltroCalendario) => useOcorrencias(f), {
      initialProps: base,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ ...base, intervalo: { de: '2026-12-01', ate: '2027-01-05' } });
    await waitFor(() =>
      expect(mockOcorrencias).toHaveBeenLastCalledWith(
        expect.objectContaining({ de: '2026-12-01', ate: '2027-01-05' }),
      ),
    );
  });

  it('sem nenhum tipo marcado não chama a API e devolve lista vazia', async () => {
    const { result } = renderHook(() => useOcorrencias({ ...base, tipos: [] }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockOcorrencias).not.toHaveBeenCalled();
    expect(result.current.ocorrencias).toEqual([]);
  });

  it('expõe o erro', async () => {
    mockOcorrencias.mockRejectedValue(new Error('Não foi possível carregar o calendário.'));
    const { result } = renderHook(() => useOcorrencias(base));
    await waitFor(() =>
      expect(result.current.error?.message).toBe('Não foi possível carregar o calendário.'),
    );
  });
});
