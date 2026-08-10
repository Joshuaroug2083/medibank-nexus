import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
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
import ResetPasswordPage      from './pages/ResetPasswordPage';
import AcceptInvitePage       from './pages/AcceptInvitePage';

/* ── Route guards ─────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/app/dashboard" replace />;
  return children;
}

/* ── Authenticated app shell (all post-login providers) ───────────────── */
function AuthenticatedApp() {
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

/* ── Public page route components ─────────────────────────────────────── */
function LandingRoute() {
  const nav = useNavigate();
  return (
    <LandingPage
      onGetStarted={()                  => nav('/onboarding?plan=free_trial')}
      onGetPro={()                      => nav('/onboarding?plan=pro')}
      onContactUs={()                   => nav('/contact')}
      onStaffLogin={()                  => nav('/auth?role=staff')}
      onPatientLogin={()                => nav('/auth?role=patient')}
      onNavigateModule={(moduleKey)     => nav(`/modules/${moduleKey}`)}
      onNavigateStatic={(pageKey)       => nav(`/static/${pageKey}`)}
    />
  );
}

function AuthRoute() {
  const nav               = useNavigate();
  const { loadTenant }    = useTenant();
  const [params]          = useSearchParams();
  const loginRole         = params.get('role') ?? 'staff';

  return (
    <AuthPage
      loginRole={loginRole}
      onSuccess={(hospitalId) => { if (hospitalId) loadTenant(hospitalId); }}
      onRegisterHospital={() => nav('/onboarding?plan=free_trial')}
    />
  );
}

function OnboardingRoute() {
  const nav          = useNavigate();
  const [params]     = useSearchParams();
  const preselectedPlan = params.get('plan') ?? 'free_trial';

  return (
    <HospitalOnboardingPage
      preselectedPlan={preselectedPlan}
      onComplete={(data) => {
        if (data?.tier === 'pro') {
          nav('/payment', { state: { onboardingData: data } });
        } else {
          nav('/auth?role=staff');
        }
      }}
      onBack={() => nav('/')}
    />
  );
}

function PaymentRoute() {
  const nav         = useNavigate();
  const { state }   = useLocation();

  if (!state?.onboardingData) return <Navigate to="/onboarding" replace />;

  return (
    <PaymentPage
      onboardingData={state.onboardingData}
      onPaymentSuccess={(ref) => {
        console.log('[Nexus] Paystack reference:', ref);
        nav('/auth?role=staff');
      }}
      onBack={() => nav('/onboarding')}
    />
  );
}

function ContactRoute() {
  const nav = useNavigate();
  return <ContactPage onBack={() => nav('/')} />;
}

function ModuleRoute() {
  const nav              = useNavigate();
  const { moduleKey }    = useParams();
  return (
    <ModuleDetailPage
      moduleKey={moduleKey}
      onBack={() => nav('/')}
      onGetStarted={() => nav('/onboarding?plan=free_trial')}
    />
  );
}

function StaticRoute() {
  const nav           = useNavigate();
  const { pageKey }   = useParams();
  return (
    <StaticPage
      pageKey={pageKey}
      onBack={() => nav('/')}
      onGetStarted={() => nav('/onboarding?plan=free_trial')}
    />
  );
}

/* ── Root ─────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>
              <Routes>
                {/* Public pages — redirect to /app/dashboard when already signed in */}
                <Route path="/"    element={<PublicRoute><LandingRoute /></PublicRoute>} />
                <Route path="/auth" element={<PublicRoute><AuthRoute /></PublicRoute>} />

                {/* Semi-public — accessible even when authenticated */}
                <Route path="/onboarding"           element={<OnboardingRoute />} />
                <Route path="/payment"              element={<PaymentRoute />} />
                <Route path="/contact"              element={<ContactRoute />} />
                <Route path="/modules/:moduleKey"   element={<ModuleRoute />} />
                <Route path="/static/:pageKey"      element={<StaticRoute />} />
                <Route path="/reset-password"       element={<ResetPasswordPage />} />
                <Route path="/accept-invite"        element={<AcceptInvitePage />} />

                {/* Protected authenticated shell — all /app/* sub-paths */}
                <Route
                  path="/app/*"
                  element={<ProtectedRoute><AuthenticatedApp /></ProtectedRoute>}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
