import { type SidebarData } from '@cincoders/cinnamon';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FolderOpen,
  Home,
  PlusCircle,
} from 'lucide-react';
import { Links } from './enums';
import cincodersLogo from '../assets/icons/logo_cincoders-icon.svg';

/**
 * Conteúdo da sidebar (Drawer aberto pelo botão de menu do Navbar).
 * `navMain` fica sempre visível; `navGroups` são seções colapsáveis.
 * Itens exclusivos do comitê estão em `COMITE_ONLY_LINKS` (`utils/enums.ts`).
 */
export const sidebar: SidebarData = {
  appName: 'Sistema de Iniciativas CIn',
  // Import de módulo (não um caminho em public/): o bundler resolve a URL
  // final já considerando o base configurado (VITE_BASE_URL), do mesmo
  // jeito que `cin-logo.svg` em pages/login.
  appLogoSrc: cincodersLogo,
  navMain: [
    { id: 'inicio', title: 'Início', href: Links.INICIO, IconComponent: Home },
    {
      id: 'submeter',
      title: 'Submeter Iniciativa',
      href: Links.SUBMETER,
      IconComponent: PlusCircle,
    },
    { id: 'minhas', title: 'Minhas Iniciativas', href: Links.MINHAS, IconComponent: FolderOpen },
    {
      id: 'aprovadas',
      title: 'Iniciativas aprovadas',
      href: Links.APROVADAS,
      IconComponent: CheckCircle2,
    },
    { id: 'calendario', title: 'Calendário', href: Links.CALENDARIO, IconComponent: CalendarDays },
    {
      id: 'analise',
      title: 'Iniciativas em análise',
      href: Links.ANALISE,
      IconComponent: ClipboardCheck,
    },
  ],
};
