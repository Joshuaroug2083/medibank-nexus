import './global.css';
import { useState } from 'react';
import { AuthProvider, useAuth }         from './context/AuthContext';
import { TenantProvider, useTenant }     from './context/TenantContext';
import { AppProvider }                   from './context/AppContext';
import { SettingsProvider }              from './context/SettingsContext';
import { IntegrationsProvider }          from './context/IntegrationsContext';
import { TourProvider }                  from './context/TourContext';
import TourOverlay                       from './components/TourOverlay';
import ErrorBoundary                     from './components/ErrorBoundary';
import { ToastProvider }                 from './components';
import LandingPage            from './pages/LandingPage';
import AuthPage               from './pages/AuthPage';
import AppShell               from './pages/AppShell';
import HospitalOnboardingPage from './pages/HospitalOnboardingPage';
import ContactPage            from './pages/ContactPage';
import PaymentPage            from './pages/PaymentPage';
import ModuleDetailPage       from './pages/ModuleDetailPage';
import StaticPage             from './pages/StaticPage';

/**
 * Top-level views (pre-auth):
 *  'landing'    — public marketing page
 *  'auth'       — login (with optional loginRole: 'staff' | 'patient')
 *  'onboarding' — hospital wizard (preselectedPlan: 'free_trial' | 'pro')
 *  'payment'    — Paystack payment for Pro
 *  'contact'    — Custom/Enterprise enquiry form
 *  'module'     — Module detail page (viewParams.moduleKey)
 *  'static'     — Static info page (viewParams.pageKey)
 */

function AppRouter() {
  const { user }       = useAuth();
  const { loadTenant } = useTenant();

  const [view,            setView]            = useState('landing');
  const [viewParams,      setViewParams]      = useState({});
  const [preselectedPlan, setPreselectedPlan] = useState('free_trial');
  const [pendingOnboard,  setPendingOnboard]  = useState(null);

  const go = (v, params = {}) => { setView(v); setViewParams(params); };

  const handleAuthSuccess = (hospitalId) => {
    if (hospitalId) loadTenant(hospitalId);
  };

  const handlePaymentSuccess = (paystackReference) => {
    console.log('[Nexus] Paystack reference:', paystackReference);
    go('auth', { loginRole: 'staff' });
  };

  /* ── Authenticated ── */
  if (user) {
    return (
      <SettingsProvider>
        <IntegrationsProvider>
          <AppProvider>
            <TourProvider>
              <AppShell />
              <TourOverlay />
            </TourProvider>
          </AppProvider>
        </IntegrationsProvider>
      </SettingsProvider>
    );
  }

  /* ── Module detail page ── */
  if (view === 'module') {
    return (
      <ModuleDetailPage
        moduleKey={viewParams.moduleKey}
        onBack={() => go('landing')}
        onGetStarted={() => { setPreselectedPlan('free_trial'); go('onboarding'); }}
      />
    );
  }

  /* ── Static page ── */
  if (view === 'static') {
    return (
      <StaticPage
        pageKey={viewParams.pageKey}
        onBack={() => go('landing')}
        onGetStarted={() => { setPreselectedPlan('free_trial'); go('onboarding'); }}
      />
    );
  }

  /* ── Contact page ── */
  if (view === 'contact') {
    return (
      <ContactPage
        onBack={() => go('landing')}
      />
    );
  }

  /* ── Payment page ── */
  if (view === 'payment' && pendingOnboard) {
    return (
      <PaymentPage
        onboardingData={pendingOnboard}
        onPaymentSuccess={handlePaymentSuccess}
        onBack={() => go('onboarding')}
      />
    );
  }

  /* ── Hospital onboarding ── */
  if (view === 'onboarding') {
    return (
      <HospitalOnboardingPage
        preselectedPlan={preselectedPlan}
        onComplete={(data) => {
          if (data?.tier === 'pro') {
            setPendingOnboard(data);
            go('payment');
          } else {
            go('auth', { loginRole: 'staff' });
          }
        }}
        onBack={() => go('landing')}
      />
    );
  }

  /* ── Auth page ── */
  if (view === 'auth') {
    return (
      <AuthPage
        loginRole={viewParams.loginRole}
        onSuccess={handleAuthSuccess}
        onRegisterHospital={() => {
          setPreselectedPlan('free_trial');
          go('onboarding');
        }}
      />
    );
  }

  /* ── Default: landing ── */
  return (
    <LandingPage
      onGetStarted={() => { setPreselectedPlan('free_trial'); go('onboarding'); }}
      onGetPro={() => { setPreselectedPlan('pro'); go('onboarding'); }}
      onContactUs={() => go('contact')}
      onStaffLogin={() => go('auth', { loginRole: 'staff' })}
      onPatientLogin={() => go('auth', { loginRole: 'patient' })}
      onNavigateModule={(moduleKey) => go('module', { moduleKey })}
      onNavigateStatic={(pageKey) => go('static', { pageKey })}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
