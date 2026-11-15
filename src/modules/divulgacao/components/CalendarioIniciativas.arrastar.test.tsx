import { render } from '@testing-library/react';
import type { EventDropArg } from '@fullcalendar/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ocorrencia } from '../divulgacao.fixtures';
import { CalendarioIniciativas } from './CalendarioIniciativas';

// Arrastar de verdade depende de eventos de ponteiro e de layout que o jsdom não tem: aqui o
// FullCalendar é substituído para capturar as props e disparar o `eventDrop` à mão. O arrasto
// no navegador fica no E2E (Playwright).
const { props } = vi.hoisted(() => ({ props: { atual: {} as Record<string, unknown> } }));
vi.mock('@fullcalendar/react', () => ({
  default: (p: Record<string, unknown>) => {
    props.atual = p;
    return null;
  },
}));

function soltar(evento: { start: Date | null; end: Date | null; allDay: boolean }, comOcorrencia = true) {
  const revert = vi.fn();
  const info = {
    event: { ...evento, extendedProps: comOcorrencia ? { ocorrencia } : {} },
    revert,
  } as unknown as EventDropArg;
  (props.atual.eventDrop as (i: EventDropArg) => void)(info);
  return revert;
}

describe('<CalendarioIniciativas>: arrastar', () => {
  beforeEach(() => {
    props.atual = {};
  });

  it('sem onArrastar, os eventos não são arrastáveis', () => {
    render(<CalendarioIniciativas eventos={[]} onIntervalo={vi.fn()} onSelecionar={vi.fn()} />);
    expect(props.atual.editable).toBe(false);
  });

  it('com onArrastar, arrasta mas não redimensiona; tem o plugin de interação', () => {
    render(
      <CalendarioIniciativas
        eventos={[]}
        onIntervalo={vi.fn()}
        onSelecionar={vi.fn()}
        onArrastar={vi.fn()}
      />,
    );
    expect(props.atual.editable).toBe(true);
    expect(props.atual.eventDurationEditable).toBe(false);
    expect((props.atual.plugins as unknown[]).length).toBe(4);
  });

  it('ao soltar, desfaz o arrasto na hora e avisa o destino com a ocorrência', () => {
    const onArrastar = vi.fn();
    render(
      <CalendarioIniciativas
        eventos={[]}
        onIntervalo={vi.fn()}
        onSelecionar={vi.fn()}
        onArrastar={onArrastar}
      />,
    );
    const inicio = new Date(2026, 10, 12, 9, 0);
    const fim = new Date(2026, 10, 12, 11, 0);

    const revert = soltar({ start: inicio, end: fim, allDay: false });

    expect(revert).toHaveBeenCalledTimes(1);
    expect(onArrastar).toHaveBeenCalledWith(ocorrencia, { inicio, fim, diaInteiro: false });
  });

  it('evento sem ocorrência (ou sem início) só é desfeito', () => {
    const onArrastar = vi.fn();
    render(
      <CalendarioIniciativas
        eventos={[]}
        onIntervalo={vi.fn()}
        onSelecionar={vi.fn()}
        onArrastar={onArrastar}
      />,
    );
    expect(soltar({ start: new Date(), end: null, allDay: true }, false)).toHaveBeenCalled();
    expect(soltar({ start: null, end: null, allDay: true })).toHaveBeenCalled();
    expect(onArrastar).not.toHaveBeenCalled();
  });
});
