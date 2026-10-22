import { BrowserRouter, Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';
import { setAuthToken, setRefreshTokenFn, setLogoutFn } from './services/api';
import PageCin from './components/PageCin';
import ForbiddenPageCin from './components/ForbiddenPageCin';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorScreen, httpErrors } from '@cincoders/cinnamon';
import { ALL_ROLES, COMITE_ROLES, Links } from './utils/enums';
import InicioPage from './pages/inicio';
import LoginPage from './pages/login';
import SubmeterPage from './pages/submeter';
import DetalhePage from './pages/detalhe';
import EditarPage from './pages/editar';
import MinhasPage from './pages/minhas';
import AprovadasPage from './pages/aprovadas';
import CalendarioPage from './pages/calendario';
import AnalisePage from './pages/analise';
import PrivacidadePage from './pages/privacidade';

/**
 * Error boundary de nível de rota: um erro de renderização numa página mostra a
 * tela de erro padrão só naquela área, e `resetKey={pathname}` faz o boundary
 * se recuperar sozinho ao navegar para outra rota — sem isso a aplicação ficaria
 * presa na tela de erro. Envolve o `<Outlet />` das rotas protegidas.
 */
function RouteErrorBoundary() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary label={`rota ${pathname}`} resetKey={pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}

function RouteMap() {
  const auth = useAuth();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && !auth.activeNavigator && !hasCheckedSession.current) {
      hasCheckedSession.current = true;
      auth.signinSilent().catch(async (err) => {
        console.error('Session validation failed on load:', err);
        try {
          await auth.removeUser();
          await auth.clearStaleState();
        } catch {
          // ignore clean up error
        }
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      setAuthToken(auth.user.access_token);
    } else {
      setAuthToken(null);
    }

    const refreshFn = async () => {
      try {
        console.log('Token expirado, tentando refresh silencioso...');
        const user = await auth.signinSilent();
        if (user) {
          setAuthToken(user.access_token);
          return user.access_token;
        }
      } catch (renewError) {
        console.error('Refresh silencioso falhou:', renewError);
      }
      return null;
    };

    setRefreshTokenFn(refreshFn);

    return () => {
      setRefreshTokenFn(null);
    };
  }, [auth]);

  useEffect(() => {
    const handleExpired = async () => {
      try {
        await auth.removeUser();
        await auth.clearStaleState();
      } catch {
        // ignore clean up error
      }
    };

    auth.events.addAccessTokenExpired(handleExpired);
    auth.events.addSilentRenewError(handleExpired);
    auth.events.addUserSignedOut(handleExpired);

    // Acionado pelo fetchApi quando uma chamada ao backend segue negada mesmo
    // após tentar renovar o token — a sessão morreu, então deslogamos. Limpar
    // o estado do auth basta: RouteMap re-renderiza e a rota / já cai para a
    // tela de login por não haver mais usuário autenticado.
    setLogoutFn(() => {
      void handleExpired();
    });

    return () => {
      auth.events.removeAccessTokenExpired(handleExpired);
      auth.events.removeSilentRenewError(handleExpired);
      auth.events.removeUserSignedOut(handleExpired);
      setLogoutFn(null);
    };
  }, [auth]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Rota raiz /: se autenticado vai para /inicio, caso contrário exibe tela de login */}
        <Route
          path={Links.HOME}
          element={
            auth.isAuthenticated ? (
              <Navigate to={Links.INICIO} replace />
            ) : (
              <LoginPage auth={auth} />
            )
          }
        />

        {/* Acesso negado: destino do redirect do RequireAuth (cinnamon). */}
        <Route path={Links.FORBIDDEN} element={<ForbiddenPageCin auth={auth} />} />

        {/* Rotas protegidas abertas a qualquer usuário do sistema. O
            RouteErrorBoundary isola falhas de renderização por página. */}
        <Route element={<PageCin auth={auth} permittedRoles={ALL_ROLES} />}>
          <Route element={<RouteErrorBoundary />}>
            <Route path={Links.INICIO} element={<InicioPage />} />
            <Route path={Links.SUBMETER} element={<SubmeterPage />} />
            <Route path={Links.DETALHE} element={<DetalhePage />} />
            <Route path={Links.EDITAR} element={<EditarPage />} />
            <Route path={Links.MINHAS} element={<MinhasPage />} />
            <Route path={Links.APROVADAS} element={<AprovadasPage />} />
            <Route path={Links.CALENDARIO} element={<CalendarioPage />} />
            <Route path={Links.PRIVACIDADE} element={<PrivacidadePage />} />
            {/* Rota desconhecida: componente de erro pronto da cinnamon (404). */}
            <Route path="*" element={<ErrorScreen errorType={httpErrors.NOTFOUND_404} />} />
          </Route>
        </Route>

        {/* Fila de análise: só comitê e administrador. Quem não tem a role é
            redirecionado para /forbidden pelo RequireAuth do cinnamon. */}
        <Route element={<PageCin auth={auth} permittedRoles={COMITE_ROLES} />}>
          <Route element={<RouteErrorBoundary />}>
            <Route path={Links.ANALISE} element={<AnalisePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default RouteMap;
