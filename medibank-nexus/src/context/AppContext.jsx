import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate as useRRNavigate } from 'react-router-dom';

const AppCtx = createContext(null);
export const useAppCtx = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const rrNavigate = useRRNavigate();

  /**
   * Initialise page from the current URL so that a hard-refresh on
   * e.g. /app/billing lands on the billing page without a flash.
   */
  const [page, setPage] = useState(() => {
    const match = window.location.pathname.match(/^\/app\/(.+)/);
    return match ? match[1] : 'dashboard';
  });

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(
    () => localStorage.getItem('nexus_sidebar_collapsed') === 'true',
  );

  /**
   * navigate(page) — updates internal context state AND pushes a real
   * URL to the browser history so the back button works.
   */
  const navigate = useCallback((p) => {
    const pageKey = p.split('?')[0];
    setPage(pageKey);
    setSidebarOpen(false);
    rrNavigate(`/app/${p}`);
  }, [rrNavigate]);

  /**
   * syncPage(page) — silent, internal-only sync called by PageRouter
   * when the URL changes (e.g. browser back/forward) so the context
   * page reflects the URL without triggering another history push.
   */
  const syncPage = useCallback((p) => setPage(p), []);

  const toggleSidebar         = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar          = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(v => {
      const next = !v;
      localStorage.setItem('nexus_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  return (
    <AppCtx.Provider value={{
      page,
      navigate,
      syncPage,
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      sidebarCollapsed,
      toggleSidebarCollapse,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
