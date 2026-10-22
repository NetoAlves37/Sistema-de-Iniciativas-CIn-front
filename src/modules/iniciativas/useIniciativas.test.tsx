import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pagina, resumos } from './iniciativas.fixtures';
import { useIniciativas } from './useIniciativas';

const mockListar = vi.fn();
vi.mock('./iniciativas.api', () => ({
  iniciativasApi: { listar: (...args: unknown[]) => mockListar(...args) },
}));

describe('useIniciativas', () => {
  beforeEach(() => {
    mockListar.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('carrega a primeira página com o filtro e o limite pedidos', async () => {
    mockListar.mockResolvedValue(pagina(resumos(3), 3));

    const { result } = renderHook(() =>
      useIniciativas({ status: 'EM_VOTACAO', ordenar: 'relevancia' }, { limit: 10 }),
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(3);
    expect(result.current.temMais).toBe(false);
    expect(mockListar).toHaveBeenCalledWith({
      status: 'EM_VOTACAO',
      ordenar: 'relevancia',
      page: 1,
      limit: 10,
    });
  });

  it('"Ver mais" pede a próxima página e acumula os itens', async () => {
    mockListar
      .mockResolvedValueOnce(pagina(resumos(2), 3, 1, 2))
      .mockResolvedValueOnce(pagina(resumos(1, {}, 3), 3, 2, 2));

    const { result } = renderHook(() => useIniciativas({ status: 'EM_ANDAMENTO' }, { limit: 2 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.temMais).toBe(true);

    act(() => result.current.verMais());
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    expect(mockListar).toHaveBeenLastCalledWith({ status: 'EM_ANDAMENTO', page: 2, limit: 2 });
    expect(result.current.items.map((i) => i.id)).toEqual(['ini-1', 'ini-2', 'ini-3']);
    expect(result.current.temMais).toBe(false);
  });

  it('expõe o erro e permite tentar de novo', async () => {
    mockListar.mockRejectedValueOnce(new Error('Falhou.')).mockResolvedValueOnce(pagina(resumos(1)));

    const { result } = renderHook(() => useIniciativas({ status: 'EM_VOTACAO' }));
    await waitFor(() => expect(result.current.error?.message).toBe('Falhou.'));

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  it('refaz tudo desde a página 1 quando o filtro muda', async () => {
    mockListar.mockResolvedValue(pagina(resumos(1)));
    const { result, rerender } = renderHook(
      ({ status }) => useIniciativas({ status }),
      { initialProps: { status: 'EM_VOTACAO' as const } as { status: 'EM_VOTACAO' | 'EM_ANALISE' } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ status: 'EM_ANALISE' });
    await waitFor(() => expect(mockListar).toHaveBeenCalledTimes(2));
    expect(mockListar).toHaveBeenLastCalledWith({ status: 'EM_ANALISE', page: 1, limit: 10 });
  });

  describe('recarga automática', () => {
    it('refaz a busca em silêncio a cada intervalo e cobre as páginas já carregadas', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockListar.mockResolvedValue(pagina(resumos(2), 2, 1, 2));
      const { result } = renderHook(() =>
        useIniciativas({ status: 'EM_VOTACAO' }, { limit: 2, recarregarACada: 60_000 }),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockListar).toHaveBeenCalledTimes(1);

      mockListar.mockResolvedValue(pagina(resumos(2, { titulo: 'Atualizada' }), 2, 1, 2));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(mockListar).toHaveBeenCalledTimes(2);
      expect(mockListar).toHaveBeenLastCalledWith({ status: 'EM_VOTACAO', page: 1, limit: 2 });
      expect(result.current.items[0].titulo).toBe('Atualizada');
      expect(result.current.isLoading).toBe(false);
    });

    it('não recarrega enquanto um campo de formulário tem o foco', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockListar.mockResolvedValue(pagina(resumos(1)));
      const campo = document.createElement('input');
      document.body.appendChild(campo);
      campo.focus();

      const { result } = renderHook(() =>
        useIniciativas({ status: 'EM_VOTACAO' }, { recarregarACada: 60_000 }),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(120_000);
      });
      expect(mockListar).toHaveBeenCalledTimes(1);

      campo.blur();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(mockListar).toHaveBeenCalledTimes(2);
    });
  });
});
