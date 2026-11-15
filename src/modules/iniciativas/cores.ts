/** Texto escuro e claro usados sobre a cor de um tipo (os mesmos das antigas `--tp-fg`). */
export const TEXTO_ESCURO = '#231f20';
export const TEXTO_CLARO = '#ffffff';

/** Cor neutra para um código que não está no cadastro (por exemplo, enquanto carrega). */
export const COR_NEUTRA = '#D1D5DB';

/** Luminância relativa (WCAG 2.x) de `#RRGGBB`. */
function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

/** Razão de contraste WCAG entre duas cores `#RRGGBB` (1 a 21). */
export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * Cor do texto sobre o fundo de um tipo: escuro ou claro, o que tiver mais contraste. Como a
 * cor do tipo é livre, é isso que mantém o nome legível no calendário e nas etiquetas.
 */
export function corDoTexto(fundo: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(fundo)) return TEXTO_ESCURO;
  return contraste(fundo, TEXTO_ESCURO) >= contraste(fundo, TEXTO_CLARO)
    ? TEXTO_ESCURO
    : TEXTO_CLARO;
}
