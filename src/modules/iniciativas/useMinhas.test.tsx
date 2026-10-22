import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pagina, resumos } from './iniciativas.fixtures';
import { totalDasContagens, useMinhas } from './useMinhas';

const mockListarMinhas = vi.fn();
vi.mock('./iniciativas.api', () => ({
  iniciativasApi: { listarMinhas: (...args: unknown[]) => mockListarMinhas(...args) },
}));

function paginaMinhas(n: number) {
  const p = pagina(resumos(n));
  return {
    ...p,
    meta: { ...p.meta, contagemPorStatus: { EM_ANDAMENTO: 2, APROVADA: 1 } },
  };
}

describe('useMinhas', () => {
  beforeEach(() => {
    mockListarMinhas.mockReset();
  });

  it('traz a contagem por status e refaz a busca no servidor ao filtrar', async () => {
    mockListarMinhas.mockResolvedValue(paginaMinhas(3));
    const { result, rerender } = renderHook(({ status }) => useMinhas(status), {
      initialProps: { status: undefined as 'APROVADA' | undefined },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contagemPorStatus).toEqual({ EM_ANDAMENTO: 2, APROVADA: 1 });
    expect(mockListarMinhas).toHaveBeenCalledWith({ status: undefined, page: 1, limit: 10 });

    rerender({ status: 'APROVADA' });
    await waitFor(() =>
      expect(mockListarMinhas).toHaveBeenLastCalledWith({ status: 'APROVADA', page: 1, limit: 10 }),
    );
    // as contagens não somem enquanto a nova lista carrega
    expect(result.current.contagemPorStatus).toBeDefined();
    await act(async () => {});
  });

  it('totalDasContagens soma todos os status', () => {
    expect(totalDasContagens({ EM_ANDAMENTO: 2, REPROVADA: 3 })).toBe(5);
    expect(totalDasContagens(undefined)).toBe(0);
  });
});
