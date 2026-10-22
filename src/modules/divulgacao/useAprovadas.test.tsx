import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pagina, resumos } from '../iniciativas/iniciativas.fixtures';
import { useAprovadas, useValorComAtraso } from './useAprovadas';

const mockAprovadas = vi.fn();
vi.mock('./divulgacao.api', () => ({
  divulgacaoApi: { aprovadas: (...args: unknown[]) => mockAprovadas(...args) },
}));

describe('useAprovadas', () => {
  beforeEach(() => {
    mockAprovadas.mockReset();
    mockAprovadas.mockResolvedValue(pagina(resumos(2, { status: 'APROVADA' })));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('busca com o filtro de tipo no servidor', async () => {
    const { result, rerender } = renderHook(
      ({ tipo }) => useAprovadas({ busca: '', tipo }),
      { initialProps: { tipo: '' as '' | 'EVENTO' } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockAprovadas).toHaveBeenCalledWith({
      q: undefined,
      tipo: undefined,
      page: 1,
      limit: 12,
    });

    rerender({ tipo: 'EVENTO' });
    await waitFor(() =>
      expect(mockAprovadas).toHaveBeenLastCalledWith({
        q: undefined,
        tipo: 'EVENTO',
        page: 1,
        limit: 12,
      }),
    );
  });

  it('só busca pelo texto 300 ms depois da última digitação', async () => {
    const { result, rerender } = renderHook(
      ({ busca }) => useAprovadas({ busca, tipo: '' }),
      { initialProps: { busca: '' } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockAprovadas).toHaveBeenCalledTimes(1);

    // Só agora o relógio falso: o carregamento inicial usa o relógio real (waitFor), e o
    // debounce é medido sem depender da velocidade da máquina.
    vi.useFakeTimers();

    rerender({ busca: 'se' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    rerender({ busca: 'semana' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(mockAprovadas).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mockAprovadas).toHaveBeenCalledTimes(2);
    expect(mockAprovadas).toHaveBeenLastCalledWith({
      q: 'semana',
      tipo: undefined,
      page: 1,
      limit: 12,
    });
  });
});

describe('useValorComAtraso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve o valor inicial na hora e o novo só depois do atraso', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useValorComAtraso(v, 300), {
      initialProps: { v: 'a' },
    });
    expect(result.current).toBe('a');
    rerender({ v: 'b' });
    expect(result.current).toBe('a');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current).toBe('b');
  });
});
