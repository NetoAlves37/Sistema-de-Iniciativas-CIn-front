import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { umDetalhe } from './detalhe.fixtures';
import { iniciativasApi } from './iniciativas.api';
import type { StatusIniciativa } from './iniciativas.types';
import { useAtualizarIniciativa, useCriarIniciativa, useRessubmeterIniciativa } from './useAcoesIniciativa';
import { INTERVALO_RECARGA_MS, useHistorico, useIniciativa } from './useIniciativa';

vi.mock('./iniciativas.api', () => ({
  iniciativasApi: {
    obter: vi.fn(),
    historico: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    ressubmeter: vi.fn(),
  },
}));

const obter = vi.mocked(iniciativasApi.obter);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIniciativa', () => {
  it('carrega o detalhe pelo id', async () => {
    obter.mockResolvedValue(umDetalhe());
    const { result } = renderHook(() => useIniciativa('ini-1'));
    expect(result.current.iniciativa).toBeUndefined();
    await waitFor(() => expect(result.current.iniciativa?.titulo).toBe('Semana de Tecnologia'));
    expect(obter).toHaveBeenCalledWith('ini-1');
  });

  it('expõe o erro quando a busca falha', async () => {
    obter.mockRejectedValue(new ApiError('Iniciativa não encontrada.', 404));
    const { result } = renderHook(() => useIniciativa('ini-1'));
    await waitFor(() => expect(result.current.error?.message).toBe('Iniciativa não encontrada.'));
    expect(result.current.iniciativa).toBeUndefined();
  });

  it('sem id não chama a API', async () => {
    const { result } = renderHook(() => useIniciativa(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(obter).not.toHaveBeenCalled();
  });

  describe('recarga automática a cada 30 s', () => {
    async function passar30s() {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(INTERVALO_RECARGA_MS);
      });
    }

    it.each<StatusIniciativa>(['EM_ANDAMENTO', 'EM_VOTACAO'])('recarrega enquanto %s', async (status) => {
      vi.useFakeTimers();
      obter.mockResolvedValue(umDetalhe({ status }));
      const { result } = renderHook(() => useIniciativa('ini-1'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.iniciativa?.status).toBe(status);
      expect(obter).toHaveBeenCalledTimes(1);

      await passar30s();
      expect(obter).toHaveBeenCalledTimes(2);
      await passar30s();
      expect(obter).toHaveBeenCalledTimes(3);
    });

    it.each<StatusIniciativa>(['EM_ANALISE', 'APROVADA', 'REPROVADA'])('não recarrega em %s', async (status) => {
      vi.useFakeTimers();
      obter.mockResolvedValue(umDetalhe({ status }));
      renderHook(() => useIniciativa('ini-1'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await passar30s();
      await passar30s();
      expect(obter).toHaveBeenCalledTimes(1);
    });

    it('reflete a transição por prazo e para de recarregar', async () => {
      vi.useFakeTimers();
      obter.mockResolvedValueOnce(umDetalhe({ status: 'EM_ANDAMENTO' }));
      obter.mockResolvedValue(umDetalhe({ status: 'EM_ANALISE' }));
      const { result } = renderHook(() => useIniciativa('ini-1'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.iniciativa?.status).toBe('EM_ANDAMENTO');
      await passar30s();
      expect(result.current.iniciativa?.status).toBe('EM_ANALISE');
      await passar30s();
      expect(obter).toHaveBeenCalledTimes(2);
    });

    it('com atualizarAuto desligado não recarrega', async () => {
      vi.useFakeTimers();
      obter.mockResolvedValue(umDetalhe());
      renderHook(() => useIniciativa('ini-1', { atualizarAuto: false }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await passar30s();
      expect(obter).toHaveBeenCalledTimes(1);
    });

    it('para de recarregar quando o componente é desmontado', async () => {
      vi.useFakeTimers();
      obter.mockResolvedValue(umDetalhe());
      const { unmount } = renderHook(() => useIniciativa('ini-1'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      unmount();
      await passar30s();
      expect(obter).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useHistorico', () => {
  it('carrega as transições e recarrega quando a versão muda', async () => {
    const historico = vi.mocked(iniciativasApi.historico);
    historico.mockResolvedValue([]);
    const { result, rerender } = renderHook(({ v }) => useHistorico('ini-1', v), {
      initialProps: { v: 'a' },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transicoes).toEqual([]);
    rerender({ v: 'b' });
    await waitFor(() => expect(historico).toHaveBeenCalledTimes(2));
  });
});

describe('hooks de ação', () => {
  const dados = {
    tipo: 'EVENTO',
    titulo: 'T',
    resumo: 'r',
    detalhe: 'd',
    inicio: '2099-01-01',
    fim: '2099-01-01',
    periodicidade: 'EVENTO_UNICO',
    espaco: 'E',
    organizadores: 'O',
    participantes: 1,
    comVotacao: true,
  } as const;

  it('useCriarIniciativa: devolve o resultado e controla "carregando"', async () => {
    vi.mocked(iniciativasApi.criar).mockResolvedValue(umDetalhe({ id: 'nova' }));
    const { result } = renderHook(() => useCriarIniciativa());
    expect(result.current.carregando).toBe(false);

    let criada;
    await act(async () => {
      criada = await result.current.executar(dados);
    });
    expect(criada).toMatchObject({ id: 'nova' });
    expect(iniciativasApi.criar).toHaveBeenCalledWith(dados);
    expect(result.current.carregando).toBe(false);
    expect(result.current.erro).toBeNull();
  });

  it('useAtualizarIniciativa: usa o id e relança o erro, guardando-o em "erro"', async () => {
    const falha = new ApiError('Iniciativas com status "Em votação" não podem ser editadas.', 409);
    vi.mocked(iniciativasApi.atualizar).mockRejectedValue(falha);
    const { result } = renderHook(() => useAtualizarIniciativa('ini-9'));

    await act(async () => {
      await expect(result.current.executar(dados)).rejects.toBe(falha);
    });
    expect(iniciativasApi.atualizar).toHaveBeenCalledWith('ini-9', dados);
    expect(result.current.erro).toBe(falha);
    expect(result.current.carregando).toBe(false);
  });

  it('useRessubmeterIniciativa: chama a ressubmissão e limpa o erro anterior', async () => {
    vi.mocked(iniciativasApi.ressubmeter)
      .mockRejectedValueOnce(new ApiError('Fora de Reprovada.', 409))
      .mockResolvedValueOnce(umDetalhe({ ciclo: 2 }));
    const { result } = renderHook(() => useRessubmeterIniciativa('ini-9'));

    await act(async () => {
      await result.current.executar(dados).catch(() => undefined);
    });
    expect(result.current.erro?.message).toBe('Fora de Reprovada.');

    await act(async () => {
      await result.current.executar(dados);
    });
    expect(iniciativasApi.ressubmeter).toHaveBeenCalledWith('ini-9', dados);
    expect(result.current.erro).toBeNull();
  });
});
