import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { semearTipos } from '../useTipos';
import { TIPOS_DE_TESTE } from '../tipos.fixtures';
import { TipoChip } from './TipoChip';

describe('<TipoChip>', () => {
  it('mostra o nome cadastrado na cor do tipo', () => {
    render(<TipoChip tipo="PESQUISA" />);
    expect(screen.getByText('Pesquisa')).toHaveStyle({
      backgroundColor: '#A7C7F2',
      color: '#231f20',
    });
  });

  it('cor escura ganha texto branco', () => {
    semearTipos([{ ...TIPOS_DE_TESTE[0], code: 'LIGA', nome: 'Liga', cor: '#1E3A8A' }]);
    render(<TipoChip tipo="LIGA" />);
    expect(screen.getByText('Liga')).toHaveStyle({ color: '#ffffff' });
  });

  it('acompanha a renomeação (o código continua o mesmo)', () => {
    semearTipos([{ ...TIPOS_DE_TESTE[2], nome: 'Festival' }]);
    render(<TipoChip tipo="EVENTO" />);
    expect(screen.getByText('Festival')).toBeInTheDocument();
  });

  it('código fora do cadastro mostra o próprio código', () => {
    render(<TipoChip tipo="ANTIGO" />);
    expect(screen.getByText('ANTIGO')).toBeInTheDocument();
  });
});
