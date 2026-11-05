import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

describe('vitest-axe', () => {
  it('detecta violação de acessibilidade (imagem sem alt) e aceita markup correto', async () => {
    const ruim = render(<img src="x.png" />);
    expect((await axe(ruim.container)).violations.length).toBeGreaterThan(0);
    ruim.unmount();

    const bom = render(<img src="x.png" alt="Logo do CIn" />);
    expect(await axe(bom.container)).toHaveNoViolations();
  });
});
