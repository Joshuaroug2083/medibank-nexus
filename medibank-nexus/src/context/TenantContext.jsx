import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HOSPITALS } from '../data/mockHospitals';

/* ── Context ── */
const TenantCtx = createContext(null);

/* ── Hook ── */
export const useTenant = () => {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error('useTenant must be used inside <TenantProvider>');
  return ctx;
};

/* ── Provider ── */
export function TenantProvider({ children }) {
  const [hospital, setHospital] = useState(() => {
    try {
      const stored = sessionStorage.getItem('nexus_tenant');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /* Persist tenant across page refreshes */
  useEffect(() => {
    if (hospital) sessionStorage.setItem('nexus_tenant', JSON.stringify(hospital));
    else          sessionStorage.removeItem('nexus_tenant');
  }, [hospital]);

  /**
   * Load tenant by hospital ID.
   * Called after login when we know which hospital the user belongs to.
   */
  const loadTenant = (hospitalId) => {
    const found = MOCK_HOSPITALS.find(h => h.id === hospitalId) ?? null;
    setHospital(found);
  };

  /**
   * Directly set a hospital object.
   * Used after successful onboarding to immediately enter the new tenant.
   */
  const setTenant = (hospitalObj) => setHospital(hospitalObj);

  /** Clear on logout */
  const clearTenant = () => setHospital(null);

  return (
    <TenantCtx.Provider value={{ hospital, loadTenant, setTenant, clearTenant }}>
      {children}
    </TenantCtx.Provider>
  );
}
