import { useState } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import TwoFactorSection from './TabSecurity2FA';
import {
  IcLock, IcEye, IcEyeOff, IcCheckCircle, IcShield,
  IcLogout, IcWarning, IcMonitor, IcPhone, IcClock,
} from '../../components/Icons';

/* Mock active sessions — in production these come from the backend */
const MOCK_SESSIONS = [
  { id: 's1', device: 'Chrome on Windows',   location: 'Lagos, NG',  lastSeen: 'Now',          current: true  },
  { id: 's2', device: 'Safari on iPhone 14', location: 'Lagos, NG',  lastSeen: '2 hours ago',  current: false },
  { id: 's3', device: 'Firefox on MacBook',  location: 'Abuja, NG',  lastSeen: '3 days ago',   current: false },
];

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-wrap">
        <div className="input-icon-left"><IcLock width={14} height={14} /></div>
        <input
          type={show ? 'text' : 'password'}
          className="input"
          style={{ paddingLeft: 36, paddingRight: 44 }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-ghost btn-icon input-btn-right"
          style={{ color: 'var(--text-400)' }}
          onClick={() => setShow(v => !v)}
          tabIndex={-1}
        >
          {show ? <IcEyeOff width={15} height={15} /> : <IcEye width={15} height={15} />}
        </button>
      </div>
    </div>
  );
}

function strengthLabel(pw) {
  if (!pw) return null;
  const strong = pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  const medium = pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw);
  const weak   = pw.length >= 8;
  if (strong) return { label: 'Strong',  color: 'var(--success)', pct: 100 };
  if (medium) return { label: 'Good',    color: 'var(--teal)',    pct: 70  };
  if (weak)   return { label: 'Weak',    color: 'var(--warning)', pct: 40  };
  return         { label: 'Too short', color: 'var(--danger)',  pct: 15  };
}

export default function TabSecurity() {
  const { logout } = useAuth();
  const toast      = useToast();

  const [cur,   setCur]   = useState('');
  const [pw,    setPw]    = useState('');
  const [pw2,   setPw2]   = useState('');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const strength = strengthLabel(pw);

  const handleChangePassword = async () => {
    if (!cur)             return toast.error('Current password is required');
    if (pw.length < 8)    return toast.error('New password must be at least 8 characters');
    if (pw !== pw2)       return toast.error('Passwords do not match');
    if (!strength || ['Too short'].includes(strength.label))
                          return toast.error('Choose a stronger password');

    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // replace with API call
    setSaving(false);
    setCur(''); setPw(''); setPw2('');
    toast.success('Password changed. You may need to sign in again on other devices.');
  };

  const revokeSession = (id) => {
    setSessions(s => s.filter(x => x.id !== id));
    toast.info('Session revoked');
  };

  const revokeAll = () => {
    setSessions(s => s.filter(x => x.current));
    toast.success('All other sessions signed out');
  };

  return (
    <div>
      {/* ── Change Password ────────────────────────────────── */}
      <div className="settings-section-title">Change Password</div>
      <p className="settings-section-desc">
        Use a strong, unique password. We recommend at least 12 characters with uppercase, numbers and symbols.
      </p>

      <div style={{ maxWidth: 420 }}>
        <PasswordField label="Current Password" value={cur} onChange={setCur} placeholder="Enter current password" />
        <PasswordField label="New Password"      value={pw}  onChange={setPw}  placeholder="Min. 8 characters" />

        {/* Strength meter */}
        {strength && (
          <div style={{ marginTop: -8, marginBottom: 14 }}>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 9999, transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: '.73rem', color: strength.color, fontWeight: 700 }}>{strength.label} password</span>
          </div>
        )}

        <PasswordField label="Confirm New Password" value={pw2} onChange={setPw2} placeholder="Re-enter new password" />

        <div className="settings-footer" style={{ paddingTop: 0 }}>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
            {saving ? <><div className="btn-spinner" /> Saving…</> : <><IcCheckCircle width={14} height={14} /> Update Password</>}
          </button>
        </div>
      </div>

      {/* ── Password Rules ─────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 28, maxWidth: 420,
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Password Requirements
        </div>
        {[
          ['At least 8 characters',         pw.length >= 8],
          ['At least one uppercase letter',  /[A-Z]/.test(pw)],
          ['At least one number',            /\d/.test(pw)],
          ['At least one special character', /[^A-Za-z0-9]/.test(pw)],
        ].map(([rule, met]) => (
          <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', padding: '3px 0',
            color: met ? 'var(--success)' : 'var(--text-400)' }}>
            <IcCheckCircle width={12} height={12} />
            {rule}
          </div>
        ))}
      </div>

      {/* ── Active Sessions ────────────────────────────────── */}
      <div className="settings-section-title" style={{ marginTop: 8 }}>Active Sessions</div>
      <p className="settings-section-desc">
        These devices are currently signed in to your account. Revoke any session you don't recognise.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxWidth: 520 }}>
        {sessions.map(s => (
          <div key={s.id} style={{
            background: 'var(--surface)', border: `1px solid ${s.current ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: s.current ? 'var(--primary-light)' : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.current ? 'var(--primary)' : 'var(--text-400)',
            }}>
              {s.device.includes('iPhone') || s.device.includes('Android')
                ? <IcPhone   width={16} height={16} />
                : <IcMonitor width={16} height={16} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text-900)' }}>
                {s.device}
                {s.current && (
                  <span style={{ marginLeft: 8, fontSize: '.7rem', background: 'var(--primary)', color: 'white',
                    padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    Current
                  </span>
                )}
              </div>
              <div style={{ fontSize: '.73rem', color: 'var(--text-400)', marginTop: 2, display: 'flex', gap: 10 }}>
                <span>{s.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IcClock width={11} height={11} /> {s.lastSeen}
                </span>
              </div>
            </div>
            {!s.current && (
              <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }}
                onClick={() => revokeSession(s.id)}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {sessions.filter(s => !s.current).length > 0 && (
          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={revokeAll}>
            <IcLogout width={14} height={14} /> Sign out all other devices
          </button>
        )}
      </div>

      {/* ── Two-Factor Authentication ─────────────────────── */}
      <div style={{ marginTop: 28, maxWidth: 520 }}>
        <TwoFactorSection />
      </div>
    </div>
  );
}
