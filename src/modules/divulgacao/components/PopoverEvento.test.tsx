import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { ocorrencia } from '../divulgacao.fixtures';
import { PopoverEvento } from './PopoverEvento';

function renderizar(onFechar = vi.fn()) {
  const resultado = render(
    <MemoryRouter>
      <p>texto fora</p>
      <PopoverEvento ocorrencia={ocorrencia} onFechar={onFechar} />
    </MemoryRouter>,
  );
  return { ...resultado, onFechar };
}

describe('<PopoverEvento>', () => {
  it('é um diálogo rotulado pelo título, com os dados da ocorrência', () => {
    renderizar();
    const dialogo = screen.getByRole('dialog', { name: 'Semana de Boas-Vindas' });

    expect(dialogo).toHaveTextContent('terça-feira, 10 de novembro, 14:00 às 16:00');
    expect(dialogo).toHaveTextContent('Evento');
    expect(dialogo).toHaveTextContent('Semanal, até 20/12/2026');
    expect(dialogo).toHaveTextContent('Auditório do CIn');
    expect(dialogo).toHaveTextContent('Bruno Lima');
  });

  it('manda o foco para o botão fechar', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus();
  });

  it('Esc fecha', () => {
    const { onFechar } = renderizar();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('outras teclas não fecham', () => {
    const { onFechar } = renderizar();
    fireEvent.keyDown(document, { key: 'a' });
    expect(onFechar).not.toHaveBeenCalled();
  });

  it('clique fora fecha; clique dentro não', () => {
    const { onFechar } = renderizar();
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onFechar).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByText('texto fora'));
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('o botão fechar chama onFechar', () => {
    const { onFechar } = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('devolve o foco para quem o tinha ao fechar', () => {
    const gatilho = document.createElement('button');
    document.body.appendChild(gatilho);
    gatilho.focus();

    const { unmount } = render(
      <MemoryRouter>
        <PopoverEvento ocorrencia={ocorrencia} onFechar={() => {}} />
      </MemoryRouter>,
    );
    expect(gatilho).not.toHaveFocus();
    unmount();
    expect(gatilho).toHaveFocus();
    gatilho.remove();
  });

  it('"Ver iniciativa" vai para o detalhe e "Adicionar ao Google Agenda" abre em outra aba com noopener', () => {
    renderizar();
    expect(screen.getByRole('link', { name: 'Ver iniciativa' })).toHaveAttribute(
      'href',
      '/iniciativas/ini-1',
    );
    const google = screen.getByRole('link', { name: 'Adicionar ao Google Agenda' });
    expect(google).toHaveAttribute('href', ocorrencia.googleAgendaUrl);
    expect(google).toHaveAttribute('target', '_blank');
    expect(google).toHaveAttribute('rel', 'noopener');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = renderizar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
