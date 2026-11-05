import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import PrivacidadePage from './index';

describe('<PrivacidadePage>', () => {
  it('explica quais dados são usados, para quê, o que não é exibido, o controlador e o contato', () => {
    render(<PrivacidadePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quais dados o sistema usa' })).toBeInTheDocument();
    expect(screen.getByText(/identificador, o seu nome e o seu perfil/)).toBeInTheDocument();
    expect(screen.getByText(/comentários \(sugestões\)/)).toBeInTheDocument();
    expect(screen.getByText(/votos que dá/)).toBeInTheDocument();

    expect(screen.getByText('Identificar a autoria das iniciativas e dos comentários.')).toBeInTheDocument();
    expect(screen.getByText('Controlar as permissões de cada pessoa (editar, votar, decidir).')).toBeInTheDocument();
    expect(screen.getByText('Exibir o seu nome nas suas contribuições.')).toBeInTheDocument();

    expect(screen.getByText(/e-mail e o seu contato não são guardados nem exibidos/)).toBeInTheDocument();
    expect(screen.getByText(/controlador dos dados é o Centro de Informática \(CIn\) da UFPE/)).toBeInTheDocument();
  });

  it('traz o contato para exercer direitos, marcado como a confirmar', () => {
    render(<PrivacidadePage />);

    expect(screen.getByRole('link', { name: 'privacidade@cin.ufpe.br' })).toHaveAttribute(
      'href',
      'mailto:privacidade@cin.ufpe.br',
    );
    expect(screen.getByText(/a confirmar/)).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<PrivacidadePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
