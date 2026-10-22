import { PageWithAuth } from "@cincoders/cinnamon";
import { Outlet, Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import type { AuthContextProps } from "react-oidc-context";
import { sidebar } from "../../utils/sidebar";
import { useAuthorization } from "../../hooks/useAuthorization";
import { MeProvider } from "../../modules/identidade/MeProvider";
import { COMITE_ONLY_LINKS, Links } from "../../utils/enums";
// Named import: lets the bundler drop the rest of package.json.
import { version as appVersion } from "../../../package.json";

interface PageCinProps {
  auth: AuthContextProps;
  /** Roles que podem acessar a rota; `['*']` libera qualquer autenticado. */
  permittedRoles: string[];
  /** Conteúdo. Sem children, renderiza o `<Outlet />` da rota aninhada. */
  children?: JSX.Element | JSX.Element[];
}

/**
 * Adapta o `Link` do react-router à interface `LinkComponent` da cinnamon
 * (que espera `href`, não `to`). Deixa a navegação da sidebar/menus
 * client-side, sem full reload.
 */
function CinnamonRouterLink({ href, ...rest }: React.ComponentProps<"a"> & { href: string }) {
  return <RouterLink to={href} {...rest} />;
}

export default function PageCin({ auth, permittedRoles, children }: PageCinProps) {
  const { isComite } = useAuthorization();
  const { pathname } = useLocation();

  // Itens exclusivos do comitê somem do menu de quem não é do comitê.
  const visibleNavMain = sidebar.navMain.filter(
    (link) => isComite || !COMITE_ONLY_LINKS.includes(link.href ?? ""),
  );

  // Título do header: nome da página atual (ex: "Início"), não o
  // nome do projeto — o nome da app já aparece no topo da sidebar.
  const currentPageTitle =
    sidebar.navMain.find((link) => link.href === pathname)?.title ?? sidebar.appName;

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to={Links.HOME} replace />;
  }

  return (
    <PageWithAuth
      // publicURL vazio é necessário: o RequireAuth do cinnamon redireciona
      // para `${publicURL}/forbidden` e, sem ele, cai em "undefined/forbidden".
      authProps={{ auth, permittedRoles, publicURL: "" }}
      navbar={{
        title: currentPageTitle,
        auth,
        accountManagementUrl: Links.ACCOUNT_MANAGEMENT,
        logoRedirectUrl: Links.INTRANET_HOME,
        // Sidebar em Drawer, aberta pelo botão de menu do Navbar.
        sidebar: { ...sidebar, navMain: visibleNavMain },
        // Rota atual: a SideMenu destaca o item cujo `href` bate com isto
        // e marca `aria-current="page"`.
        activeHref: pathname,
        // Navegação interna sem full reload (sidebar, popup de sistemas, menu da conta).
        linkComponent: CinnamonRouterLink,
      }}
      footer={{
        // Preset "cin": traz o bloco de Suporte Técnico do CIn pronto.
        variant: "cin",
        appVersion,
        // linkColumns substitui as colunas do preset: repetimos "Recursos" e acrescentamos
        // o link de Privacidade (RNF-01) em todas as telas. O Footer abre links em nova aba.
        linkColumns: [
          {
            title: "Recursos",
            links: [
              { label: "Materiais", href: "https://ascom.cin.ufpe.br/materiais" },
              { label: "Portal CIn", href: "https://portal.cin.ufpe.br" },
              { label: "Intranet", href: "https://intranet.cin.ufpe.br" },
              { label: "Informações públicas", href: "https://info.cin.ufpe.br" },
            ],
          },
          {
            title: "Sistema",
            links: [
              {
                label: "Privacidade",
                href: `${import.meta.env.BASE_URL.replace(/\/$/, "")}${Links.PRIVACIDADE}`,
              },
            ],
          },
        ],
      }}
      centralized={false}
      haveToast={false} // Toasts already handled in App.tsx
    >
      <MeProvider>{children ?? <Outlet />}</MeProvider>
    </PageWithAuth>
  );
}
