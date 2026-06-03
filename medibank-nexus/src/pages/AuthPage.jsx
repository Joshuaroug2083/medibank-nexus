import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS, ROLE_CONFIG } from '../data/mockUsers';
import {
  IcHospital, IcShield, IcWifi, IcCheckCircle,
  IcMail, IcLock, IcEye, IcEyeOff, IcArrowRight,
  IcPersonAdd, IcStethoscope, IcPill, IcGear, IcPerson,
  IcWarning,
} from '../components/Icons';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/* ── role icon map ─────────────────────────────────────────── */
const ROLE_ICONS = {
  nurse:       <IcPersonAdd   width={14} height={14} />,
  doctor:      <IcStethoscope width={14} height={14} />,
  pharmacist:  <IcPill        width={14} height={14} />,
  admin:       <IcGear        width={14} height={14} />,
  patient:     <IcPerson      width={14} height={14} />,
};

/* ── Forgot Password Panel ─────────────────────────────────── */
function ForgotPasswordPanel({ onBack }) {
  const [view,      setView]      = useState('request'); // request | sent | reset | done
  const [email,     setEmail]     = useState('');
  const [token,     setToken]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [devToken,  setDevToken]  = useState('');

  const requestReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.devToken) setDevToken(data.devToken); // dev only
      setView('sent');
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    if (!token.trim()) return setError('Enter the reset token');
    if (newPw.length < 8) return setError('Password must be at least 8 characters');
    if (newPw !== confirmPw) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Reset failed');
      setView('done');
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '.84rem', fontWeight: 600, marginBottom: 20, padding: 0 }}
      >
        ← Back to Sign In
      </button>

      {view === 'request' && (
        <>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>Reset Password</div>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the email address associated with your account and we'll send a reset link.
          </p>
          {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}><IcWarning width={14} height={14} />{error}</div>}
          <form onSubmit={requestReset}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <div className="input-icon-left"><IcMail width={15} height={15} /></div>
                <input type="email" className="input" style={{ paddingLeft: 36 }} value={email} onChange={e => setEmail(e.target.value)} placeholder="user@medibank.ng" disabled={loading} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="btn-spinner" /> Sending…</> : <>Send Reset Link <IcArrowRight width={14} height={14} /></>}
            </button>
          </form>
        </>
      )}

      {view === 'sent' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <IcCheckCircle width={40} height={40} style={{ color: 'var(--success)', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>Check your email</div>
            <p style={{ fontSize: '.84rem', color: 'var(--text-500)', lineHeight: 1.6 }}>
              If an account with <strong>{email}</strong> exists, a password reset link has been sent.
            </p>
          </div>
          {devToken && (
            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '.78rem', marginBottom: 16 }}>
              <strong>Dev Mode Token:</strong>{' '}
              <code style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{devToken}</code>
              <br /><button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '.78rem', marginTop: 6 }} onClick={() => { setToken(devToken); setView('reset'); }}>
                Use this token to reset →
              </button>
            </div>
          )}
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setView('reset')}>
            I have the token — Enter it here
          </button>
        </>
      )}

      {view === 'reset' && (
        <>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>Set New Password</div>
          {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}><IcWarning width={14} height={14} />{error}</div>}
          <form onSubmit={doReset}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Reset Token</label>
              <input type="text" className="input" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste the token from your email" style={{ fontFamily: 'var(--font-mono)', fontSize: '.84rem' }} disabled={loading} />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">New Password</label>
              <div className="input-wrap">
                <div className="input-icon-left"><IcLock width={15} height={15} /></div>
                <input type="password" className="input" style={{ paddingLeft: 36 }} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" disabled={loading} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Confirm Password</label>
              <input type="password" className="input" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" disabled={loading} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="btn-spinner" /> Resetting…</> : <>Set New Password</>}
            </button>
          </form>
        </>
      )}

      {view === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <IcCheckCircle width={40} height={40} style={{ color: 'var(--success)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>Password Reset!</div>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 20 }}>Your password has been updated. Please sign in with your new password.</p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onBack}>
            Go to Sign In <IcArrowRight width={14} height={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── component ─────────────────────────────────────────────── */
export default function AuthPage({ onSuccess, onRegisterHospital, loginRole }) {
  const { login, quickLogin, loading, loginError, setLoginError } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [touched,  setTouched]  = useState({ email: false, password: false });
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot'

  const emailRef = useRef(null);

  /* auto-focus email on mount */
  useEffect(() => { emailRef.current?.focus(); }, []);

  /* clear server error when user starts typing */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (loginError) setLoginError('');
  };
  const handlePwChange = (e) => {
    setPassword(e.target.value);
    if (loginError) setLoginError('');
  };

  /* inline validation */
  const emailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;
  const showEmailErr  = touched.email    && !emailValid;
  const showPwErr     = touched.password && !passwordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!emailValid || !passwordValid) return;
    const result = await login(email, password);
    if (result?.success) onSuccess?.(result.hospitalId);
  };

  const handleQuickLogin = async (user) => {
    setLoginError('');
    setEmail(user.email);
    setPassword(user.password);
    const result = await quickLogin(user);
    onSuccess?.(result?.hospitalId);
  };

  /* ── render ── */
  return (
    <div className="auth-root">

      {/* ══════════════════════════════════════════════
          LEFT — HERO PANEL
      ══════════════════════════════════════════════ */}
      <div className="auth-hero-panel">
        <div className="auth-hero-grid" />

        {/* Logo */}
        <div className="auth-hero-content">
          <div className="auth-logo anim-fade-up">
            <div className="auth-logo-icon">
              <IcHospital width={22} height={22} />
            </div>
            MediBank Nexus
          </div>

          {/* Headline */}
          <h1 className="auth-hero-headline anim-fade-up anim-d1">
            The Digital Backbone<br />
            <span className="auth-hero-dim">of Healthcare</span><br />
            in Africa
          </h1>

          <p className="auth-hero-desc anim-fade-up anim-d2">
            Connecting nurses, doctors, pharmacists and patients —
            with AI at every step of the care workflow.
          </p>

          {/* Role pills */}
          <div className="auth-role-pills anim-fade-up anim-d3">
            {MOCK_USERS.map(u => (
              <div key={u.role} className="auth-role-pill">
                {ROLE_ICONS[u.role]}
                {ROLE_CONFIG[u.role].label}
              </div>
            ))}
          </div>
        </div>

        {/* Feature list */}
        <div className="auth-hero-footer anim-fade-up anim-d4">
          {[
            [<IcShield        width={12} height={12} />, 'NDPR Compliant',    'Patient data fully protected'],
            [<IcCheckCircle   width={12} height={12} />, 'AI-Powered',        'Nexus AI assists every role'],
            [<IcWifi          width={12} height={12} />, 'Offline Ready',     'Works on low connectivity'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="auth-feature-row">
              <div className="auth-feature-check">{icon}</div>
              <span>
                <strong>{title}</strong> — {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT — FORM PANEL
      ══════════════════════════════════════════════ */}
      <div className="auth-form-panel">
        <div className="auth-form-box anim-fade-up">

          {authView === 'forgot' && <ForgotPasswordPanel onBack={() => setAuthView('login')} />}

          {authView === 'login' && <>

          {/* Header */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {loginRole === 'patient' ? 'Patient Sign In' : loginRole === 'staff' ? 'Staff Sign In' : 'Sign in to Nexus'}
            </h2>
            <p className="auth-form-sub">
              {loginRole === 'patient'
                ? 'Access your health records, appointments, and prescriptions'
                : loginRole === 'staff'
                ? 'Sign in with your hospital staff credentials'
                : 'Use a quick demo login or enter credentials manually'
              }
            </p>
          </div>

          <div className="auth-card">

            {/* ── QUICK LOGIN GRID ── */}
            <div className="quick-login-label">
              Quick demo login
              {loginRole === 'patient' && <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--teal)', fontWeight: 700 }}>— Patient</span>}
              {loginRole === 'staff'   && <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--primary)', fontWeight: 700 }}>— Staff</span>}
            </div>
            <div className="quick-login-grid">
              {MOCK_USERS.filter(u => {
                if (loginRole === 'patient') return u.role === 'patient';
                if (loginRole === 'staff')   return u.role !== 'patient';
                return true;
              }).map(u => {
                const cfg = ROLE_CONFIG[u.role];
                return (
                  <button
                    key={u.id}
                    className="quick-btn"
                    onClick={() => handleQuickLogin(u)}
                    disabled={loading}
                    title={`Login as ${u.name}`}
                    style={{ '--role-color': cfg.color, '--role-bg': cfg.bg }}
                  >
                    <span className="quick-btn-icon" style={{ color: cfg.color }}>
                      {ROLE_ICONS[u.role]}
                    </span>
                    <span className="quick-btn-label">{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── DIVIDER ── */}
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or sign in manually</span>
              <span className="auth-divider-line" />
            </div>

            {/* ── LOGIN FORM ── */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Server error */}
              {loginError && (
                <div className="alert alert-danger anim-fade-down" style={{ marginBottom: 16 }}>
                  <IcWarning width={16} height={16} />
                  {loginError}
                </div>
              )}

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" htmlFor="auth-email">
                  Email Address
                </label>
                <div className="input-wrap">
                  <div className="input-icon-left">
                    <IcMail width={15} height={15} />
                  </div>
                  <input
                    ref={emailRef}
                    id="auth-email"
                    type="email"
                    className={`input${showEmailErr ? ' error' : ''}`}
                    style={{ paddingLeft: 36 }}
                    placeholder="user@medibank.ng"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {showEmailErr && (
                  <div className="form-error anim-fade-down">
                    <IcWarning width={12} height={12} />
                    Please enter a valid email address
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>Password</label>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '.78rem', fontWeight: 600 }} onClick={() => setAuthView('forgot')}>
                    Forgot password?
                  </button>
                </div>
                <div className="input-wrap">
                  <div className="input-icon-left">
                    <IcLock width={15} height={15} />
                  </div>
                  <input
                    id="auth-password"
                    type={showPw ? 'text' : 'password'}
                    className={`input${showPwErr ? ' error' : ''}`}
                    style={{ paddingLeft: 36, paddingRight: 44 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePwChange}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon input-btn-right"
                    style={{ color: 'var(--text-400)' }}
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw
                      ? <IcEyeOff width={16} height={16} />
                      : <IcEye    width={16} height={16} />
                    }
                  </button>
                </div>
                {showPwErr && (
                  <div className="form-error anim-fade-down">
                    <IcWarning width={12} height={12} />
                    Password must be at least 6 characters
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={loading}
              >
                {loading
                  ? <><div className="btn-spinner" /> Signing in…</>
                  : <>Sign In <IcArrowRight width={15} height={15} /></>
                }
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="auth-footer-note">
            Protected by TLS 1.3 encryption · NDPR compliant · v2.0
          </p>
          {onRegisterHospital && (
            <p className="auth-footer-note" style={{ marginTop: 8 }}>
              New facility?{' '}
              <span
                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={onRegisterHospital}
              >
                Register your hospital
              </span>
            </p>
          )}
          </>}

        </div>
      </div>
    </div>
  );
}
