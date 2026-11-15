import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COR_NEUTRA } from './cores';
import { tiposApi } from './tipos.api';
import { TIPOS_DE_TESTE } from './tipos.fixtures';
import { recarregarTipos, semearTipos, useTipos, visualDoTipo } from './useTipos';

vi.mock('./tipos.api', () => ({ tiposApi: { listar: vi.fn() } }));
const listar = vi.mocked(tiposApi.listar);

const desativado = { ...TIPOS_DE_TESTE[1], ativo: false };

describe('useTipos', () => {
  beforeEach(() => {
    listar.mockReset();
    semearTipos(null);
  });

  it('carrega uma vez e compartilha entre os componentes', async () => {
    listar.mockResolvedValue(TIPOS_DE_TESTE);

    const a = renderHook(() => useTipos());
    const b = renderHook(() => useTipos());
    expect(a.result.current.carregando).toBe(true);

    await waitFor(() => expect(a.result.current.todos).toHaveLength(3));
    expect(b.result.current.todos).toHaveLength(3);
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('ativos exclui os desativados; todos mantém', () => {
    semearTipos([TIPOS_DE_TESTE[0], desativado, TIPOS_DE_TESTE[2]]);
    const { result } = renderHook(() => useTipos());
    expect(result.current.todos.map((t) => t.code)).toEqual(['EXTENSAO', 'PESQUISA', 'EVENTO']);
    expect(result.current.ativos.map((t) => t.code)).toEqual(['EXTENSAO', 'EVENTO']);
  });

  it('com tipos já semeados não chama a API', () => {
    semearTipos(TIPOS_DE_TESTE);
    renderHook(() => useTipos());
    expect(listar).not.toHaveBeenCalled();
  });

  it('expõe o erro e não fica tentando de novo sozinho', async () => {
    listar.mockRejectedValue(new Error('Não foi possível carregar os tipos de iniciativa.'));
    const { result, rerender } = renderHook(() => useTipos());

    await waitFor(() => expect(result.current.erro?.message).toMatch(/Não foi possível/));
    expect(result.current.carregando).toBe(false);
    rerender();
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('recarregar busca de novo e todos os componentes veem o resultado', async () => {
    semearTipos(TIPOS_DE_TESTE);
    const { result } = renderHook(() => useTipos());
    listar.mockResolvedValue([...TIPOS_DE_TESTE, { ...TIPOS_DE_TESTE[0], id: 9, code: 'LIGA', nome: 'Liga' }]);

    await act(() => recarregarTipos());

    expect(result.current.todos.map((t) => t.code)).toContain('LIGA');
  });

  it('chamadas simultâneas de recarregar fazem uma requisição só', async () => {
    listar.mockResolvedValue(TIPOS_DE_TESTE);
    await act(() => Promise.all([recarregarTipos(), recarregarTipos(), recarregarTipos()]));
    expect(listar).toHaveBeenCalledTimes(1);
  });
});

describe('visualDoTipo', () => {
  it('usa nome e cor do cadastro e escolhe a cor do texto', () => {
    expect(visualDoTipo('EVENTO', TIPOS_DE_TESTE)).toEqual({
      code: 'EVENTO',
      nome: 'Evento',
      cor: '#F7AE85',
      corTexto: '#231f20',
      ativo: true,
    });
  });

  it('código fora do cadastro (ou antes de carregar) mostra o próprio código em cor neutra', () => {
    expect(visualDoTipo('XYZ', TIPOS_DE_TESTE)).toMatchObject({ nome: 'XYZ', cor: COR_NEUTRA });
    expect(visualDoTipo('EVENTO', null)).toMatchObject({ nome: 'EVENTO', cor: COR_NEUTRA });
  });
});
