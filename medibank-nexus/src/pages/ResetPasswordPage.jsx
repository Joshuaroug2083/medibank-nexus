import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IcHospital, IcLock, IcEye, IcEyeOff, IcArrowRight,
  IcCheckCircle, IcWarning
} from '../components/Icons';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Reset token is missing from the URL.');
    if (!email) return setError('Email address is missing from the URL.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return setError(data.error ?? 'Failed to reset password. The link may have expired.');
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
            <h2 className="auth-form-title">Reset Password</h2>
            <p className="auth-form-sub">
              Set a secure new password for your account
            </p>
          </div>

          <div className="auth-card">
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <IcCheckCircle width={48} height={48} style={{ color: 'var(--success)', margin: '0 auto 16px', display: 'block' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-900)' }}>Password Updated!</div>
                <p style={{ fontSize: '.87rem', color: 'var(--text-500)', marginBottom: 24, lineHeight: 1.6 }}>
                  Your password has been successfully reset. You can now log in using your new credentials.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  onClick={() => navigate('/auth')}
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

                {/* Email Display (read-only for security confirmation) */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Resetting account for</label>
                  <input
                    type="text"
                    className="input"
                    value={email}
                    disabled
                    style={{ background: 'var(--surface-2)', cursor: 'not-allowed', color: 'var(--text-500)' }}
                  />
                </div>

                {/* New Password */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <div className="input-wrap">
                    <div className="input-icon-left">
                      <IcLock width={15} height={15} />
                    </div>
                    <input
                      id="new-password"
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
                      placeholder="Repeat new password"
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
                    <><div className="btn-spinner" /> Resetting password...</>
                  ) : (
                    <>Reset Password <IcArrowRight width={15} height={15} /></>
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
