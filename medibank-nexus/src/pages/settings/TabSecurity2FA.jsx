/**
 * 2FA section — embedded inside TabSecurity
 * Exported as a standalone component and used within TabSecurity.
 */
import { useState } from 'react';
import { apiFetch } from '../../context/AuthContext';
import { IcShield, IcCheckCircle, IcWarning, IcLock } from '../../components/Icons';

export default function TwoFactorSection() {
  const [view,    setView]    = useState('idle'); // idle | enrolling | confirming | active | disabling
  const [secret,  setSecret]  = useState('');
  const [qrUri,   setQrUri]   = useState('');
  const [code,    setCode]    = useState('');
  const [password,setPassword]= useState('');
  const [backup,  setBackup]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [enabled, setEnabled] = useState(false); // TODO: fetch from /auth/me

  const enroll = async () => {
    setLoading(true); setError('');
    try {
      const res  = await apiFetch('/api/v1/auth/2fa/enroll', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setSecret(data.secret);
      setQrUri(data.otpauthUrl);
      setView('confirming');
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const confirm = async () => {
    if (!code.trim()) return setError('Enter the 6-digit code from your authenticator app');
    setLoading(true); setError('');
    try {
      const res  = await apiFetch('/api/v1/auth/2fa/confirm', {
        method: 'POST',
        body:   JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setBackup(data.backupCodes);
      setEnabled(true);
      setView('active');
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const disable = async () => {
    if (!password.trim()) return setError('Enter your password to disable 2FA');
    setLoading(true); setError('');
    try {
      const res  = await apiFetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        body:   JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setEnabled(false);
      setView('idle');
      setPassword('');
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <IcShield width={16} height={16} style={{ color: enabled ? 'var(--success)' : 'var(--text-400)' }} />
        <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-900)' }}>
          Two-Factor Authentication (2FA)
        </span>
        {enabled && (
          <span style={{
            marginLeft: 'auto', fontSize: '.72rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: 'var(--success-light)', color: 'var(--success)',
          }}>
            ENABLED
          </span>
        )}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: '.8rem', color: 'var(--danger-dark)', marginBottom: 14, display: 'flex', gap: 6 }}>
          <IcWarning width={13} height={13} /> {error}
        </div>
      )}

      {/* ── IDLE: not enrolled ── */}
      {view === 'idle' && !enabled && (
        <>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', lineHeight: 1.6, marginBottom: 16 }}>
            Protect your account with an authenticator app (Google Authenticator, Authy, etc.).
            You'll enter a 6-digit code each time you sign in.
          </p>
          <button className="btn btn-outline" onClick={enroll} disabled={loading}>
            {loading ? <><div className="btn-spinner" /> Loading…</> : <><IcShield width={13} height={13} /> Enable 2FA</>}
          </button>
        </>
      )}

      {/* ── CONFIRMING: show QR + enter first code ── */}
      {view === 'confirming' && (
        <>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 14 }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          {/* QR Code — use Google Charts API */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`}
              alt="2FA QR Code"
              style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 8 }}
            />
            <div style={{ marginTop: 10, fontSize: '.76rem', color: 'var(--text-400)', fontFamily: 'var(--font-mono)' }}>
              Manual key: {secret}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Enter verification code</label>
            <input
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '0.2em', width: 160, textAlign: 'center' }}
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={confirm} disabled={loading || code.length < 6}>
              {loading ? <><div className="btn-spinner" /> Verifying…</> : <><IcCheckCircle width={13} height={13} /> Confirm & Enable</>}
            </button>
            <button className="btn btn-ghost" onClick={() => { setView('idle'); setError(''); }}>Cancel</button>
          </div>
        </>
      )}

      {/* ── ACTIVE: 2FA just enabled, show backup codes ── */}
      {view === 'active' && backup.length > 0 && (
        <>
          <div style={{ padding: '12px 16px', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--success-dark)', marginBottom: 6 }}>
              <IcCheckCircle width={14} height={14} style={{ marginRight: 5 }} />2FA is now active!
            </div>
            <p style={{ fontSize: '.82rem', color: 'var(--success-dark)', lineHeight: 1.5 }}>
              Save these backup codes. Each can be used once if you lose your phone.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8,
            background: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: 16,
          }}>
            {backup.map(c => (
              <code key={c} style={{ fontSize: '.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-800)', textAlign: 'center', padding: '4px 8px', background: 'white', borderRadius: 4, border: '1px solid var(--border)' }}>
                {c}
              </code>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setView('enabled')}>
            I've saved my backup codes
          </button>
        </>
      )}

      {/* ── ENABLED: already on, show disable option ── */}
      {(view === 'enabled' || (view === 'idle' && enabled)) && (
        <>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 14 }}>
            Two-factor authentication is active. To disable it, enter your account password.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <div className="input-icon-left"><IcLock width={13} height={13} /></div>
                <input type="password" className="input" style={{ paddingLeft: 34 }} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your account password" />
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={disable} disabled={loading || !password}>
              {loading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
