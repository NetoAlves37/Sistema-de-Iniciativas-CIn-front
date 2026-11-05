import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { pagina, resumo } from '../iniciativas/iniciativas.fixtures';
import { useFila } from './useFila';

const mockFila = vi.fn();
vi.mock('./avaliacao.api', () => ({
  avaliacaoApi: { fila: (...args: unknown[]) => mockFila(...args) },
}));

describe('useFila', () => {
  it('carrega a fila de análise paginada', async () => {
    mockFila.mockResolvedValue(pagina([{ ...resumo({ status: 'EM_ANALISE' }), souAutor: true }]));

    const { result } = renderHook(() => useFila(20));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFila).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result.current.items[0].souAutor).toBe(true);
    expect(result.current.total).toBe(1);
  });
});
