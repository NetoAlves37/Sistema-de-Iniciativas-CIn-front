import { useMemo, useState } from 'react';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { intervaloDeDatas, type IntervaloCalendario } from '../useOcorrencias';
import type { Ocorrencia } from '../divulgacao.api';

const LARGURA_CELULAR = '(max-width: 640px)';

interface CalendarioIniciativasProps {
  eventos: EventInput[];
  /** Chamado quando as datas visíveis mudam (inclusive na montagem). */
  onIntervalo: (intervalo: IntervaloCalendario) => void;
  /** Clique num evento: a ocorrência e o elemento clicado (âncora do popover). */
  onSelecionar: (ocorrencia: Ocorrencia, ancora: HTMLElement) => void;
}

/** Calendário (FullCalendar 6) em pt-BR, com as visões Mês, Semana, Dia e Agenda. */
export function CalendarioIniciativas({
  eventos,
  onIntervalo,
  onSelecionar,
}: CalendarioIniciativasProps) {
  // Até 640 px: visão inicial em lista e a barra de visões no rodapé. Fixado na montagem.
  const [estreito] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(LARGURA_CELULAR).matches,
  );

  const barras = useMemo(
    () =>
      estreito
        ? {
            headerToolbar: { left: 'prev,next today', center: '', right: 'title' },
            footerToolbar: { center: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth' },
          }
        : {
            headerToolbar: {
              left: 'today prev,next title',
              center: '',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            },
            footerToolbar: false as const,
          },
    [estreito],
  );

  const aoMudarDatas = (info: DatesSetArg) => onIntervalo(intervaloDeDatas(info.start, info.end));

  const aoClicar = (info: EventClickArg) => {
    info.jsEvent.preventDefault();
    const ocorrencia = info.event.extendedProps.ocorrencia as Ocorrencia | undefined;
    if (ocorrencia) onSelecionar(ocorrencia, info.el);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
      locales={[ptBrLocale]}
      locale="pt-br"
      initialView={estreito ? 'listMonth' : 'dayGridMonth'}
      headerToolbar={barras.headerToolbar}
      footerToolbar={barras.footerToolbar}
      // Sem ícones: os ícones do FullCalendar são `role="img"` sem texto alternativo. Anterior e
      // próximo viram texto, que também é o nome acessível dos botões.
      buttonIcons={false}
      buttonText={{
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        list: 'Agenda',
        prev: 'Anterior',
        next: 'Próximo',
      }}
      height="auto"
      firstDay={0}
      nowIndicator
      dayMaxEvents={3}
      eventDisplay="block"
      slotMinTime="07:00:00"
      slotMaxTime="23:00:00"
      allDayText="Dia todo"
      noEventsText="Nenhuma iniciativa aprovada neste período."
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      events={eventos}
      eventClick={aoClicar}
      datesSet={aoMudarDatas}
    />
  );
}
