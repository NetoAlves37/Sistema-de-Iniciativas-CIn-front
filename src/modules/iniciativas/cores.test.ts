import { describe, expect, it } from 'vitest';
import { contraste, corDoTexto, TEXTO_CLARO, TEXTO_ESCURO } from './cores';

describe('corDoTexto', () => {
  it('fundo claro usa texto escuro; fundo escuro usa texto claro', () => {
    expect(corDoTexto('#9BE0A0')).toBe(TEXTO_ESCURO);
    expect(corDoTexto('#FFFF00')).toBe(TEXTO_ESCURO);
    expect(corDoTexto('#1E3A8A')).toBe(TEXTO_CLARO);
    expect(corDoTexto('#000000')).toBe(TEXTO_CLARO);
  });

  it('escolhe sempre o de maior contraste', () => {
    for (const fundo of ['#FF0000', '#00AA00', '#3B82F6', '#808080', '#F7AE85']) {
      const escolhido = corDoTexto(fundo);
      const outro = escolhido === TEXTO_ESCURO ? TEXTO_CLARO : TEXTO_ESCURO;
      expect(contraste(fundo, escolhido)).toBeGreaterThanOrEqual(contraste(fundo, outro));
    }
  });

  it('cor inválida cai no texto escuro', () => {
    expect(corDoTexto('azul')).toBe(TEXTO_ESCURO);
  });
});
