import { createContext, useContext, useState, useCallback } from 'react';

const AppCtx = createContext(null);
export const useAppCtx = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('nexus_sidebar_collapsed') === 'true'
  );

  const navigate  = useCallback((p) => {
    setPage(p);
    setSidebarOpen(false);   // close mobile drawer on navigate
  }, []);

  const toggleSidebar  = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar   = useCallback(() => setSidebarOpen(false),   []);
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(v => {
      const next = !v;
      localStorage.setItem('nexus_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  return (
    <AppCtx.Provider value={{ page, navigate, sidebarOpen, toggleSidebar, closeSidebar, sidebarCollapsed, toggleSidebarCollapse }}>
      {children}
    </AppCtx.Provider>
  );
}
