import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IcHospital, IcLock, IcEye, IcEyeOff, IcArrowRight,
  IcCheckCircle, IcWarning, IcPerson
} from '../components/Icons';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';
  const hospitalName = searchParams.get('hospital') ?? 'your hospital';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Invitation token is missing from the URL.');
    if (!email) return setError('Email address is missing from the URL.');
    if (!name.trim()) return setError('Please enter your full name.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/staff/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, name: name.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return setError(data.error ?? 'Failed to accept invitation. The link may have expired or is invalid.');
      }

      setSuccess(true);
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-form-panel" style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <div className="auth-form-box">
          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-logo" style={{ justifyContent: 'center', color: 'var(--text-900)' }}>
              <div className="auth-logo-icon" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary-200)' }}>
                <IcHospital width={22} height={22} style={{ fill: 'var(--primary)' }} />
              </div>
              <span style={{ color: 'var(--primary)' }}>MediBank Nexus</span>
            </div>
            <h2 className="auth-form-title">Join {hospitalName}</h2>
            <p className="auth-form-sub">
              Complete your profile setup to join the facility
            </p>
          </div>

          <div className="auth-card">
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <IcCheckCircle width={48} height={48} style={{ color: 'var(--success)', margin: '0 auto 16px', display: 'block' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-900)' }}>Invitation Accepted!</div>
                <p style={{ fontSize: '.87rem', color: 'var(--text-500)', marginBottom: 24, lineHeight: 1.6 }}>
                  Your account has been set up successfully. You can now sign in using your credentials.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  onClick={() => navigate('/auth?role=staff')}
                >
                  Go to Sign In <IcArrowRight width={15} height={15} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Warnings / Errors */}
                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcWarning width={16} height={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Display (read-only) */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="text"
                    className="input"
                    value={email}
                    disabled
                    style={{ background: 'var(--surface-2)', cursor: 'not-allowed', color: 'var(--text-500)' }}
                  />
                </div>

                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" htmlFor="full-name">Full Name</label>
                  <div className="input-wrap">
                    <div className="input-icon-left">
                      <IcPerson width={15} height={15} />
                    </div>
                    <input
                      id="full-name"
                      type="text"
                      className="input"
                      style={{ paddingLeft: 36 }}
                      placeholder="e.g. Dr. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" htmlFor="password">Set Password</label>
                  <div className="input-wrap">
                    <div className="input-icon-left">
                      <IcLock width={15} height={15} />
                    </div>
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingLeft: 36, paddingRight: 44 }}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon input-btn-right"
                      style={{ color: 'var(--text-400)' }}
                      onClick={() => setShowPw(v => !v)}
                      tabIndex={-1}
                    >
                      {showPw ? <IcEyeOff width={16} height={16} /> : <IcEye width={16} height={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                  <div className="input-wrap">
                    <div className="input-icon-left">
                      <IcLock width={15} height={15} />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingLeft: 36, paddingRight: 44 }}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon input-btn-right"
                      style={{ color: 'var(--text-400)' }}
                      onClick={() => setShowConfirmPw(v => !v)}
                      tabIndex={-1}
                    >
                      {showConfirmPw ? <IcEyeOff width={16} height={16} /> : <IcEye width={16} height={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  disabled={loading || !token || !email}
                >
                  {loading ? (
                    <><div className="btn-spinner" /> Setting up account...</>
                  ) : (
                    <>Join Facility <IcArrowRight width={15} height={15} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
