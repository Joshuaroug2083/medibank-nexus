import { useState, useRef } from 'react';
import { useAuth }     from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTenant }   from '../../context/TenantContext';
import { useToast }    from '../../components/Toast';
import { ROLE_CONFIG } from '../../data/mockUsers';
import {
  IcPerson, IcMail, IcPhone, IcCheckCircle, IcCamera, IcHospital,
} from '../../components/Icons';

/* roles whose job title is set by admin — staff cannot edit it */
const STAFF_ROLES = ['nurse', 'doctor', 'pharmacist'];

/* Max image size: 2 MB */
const MAX_BYTES = 2 * 1024 * 1024;

function PhotoUploader({ src, label, onUpload, shape = 'circle', size = 88, color = 'var(--primary)' }) {
  const inputRef = useRef(null);
  const toast    = useToast();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target.result);
    reader.readAsDataURL(file);
    /* reset input so same file can be re-selected */
    e.target.value = '';
  };

  const radius = shape === 'circle' ? '50%' : `${Math.round(size * 0.18)}px`;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Photo or placeholder */}
      <div
        style={{
          width: size, height: size, borderRadius: radius, overflow: 'hidden',
          background: src
            ? 'transparent'
            : `color-mix(in srgb, ${color} 15%, white)`,
          border: `2px solid color-mix(in srgb, ${color} 35%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(10,110,189,.15)',
        }}
        onClick={() => inputRef.current?.click()}
        title={`Click to upload ${label}`}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        {src
          ? <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <IcCamera width={Math.round(size * 0.28)} height={Math.round(size * 0.28)} style={{ color }} />
        }
      </div>

      {/* Overlay upload button */}
      <button
        type="button"
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 28, height: 28, borderRadius: '50%',
          background: color, border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.2)',
        }}
        onClick={() => inputRef.current?.click()}
        title={`Change ${label}`}
        aria-label={`Change ${label}`}
      >
        <IcCamera width={12} height={12} style={{ color: 'white' }} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

export default function TabProfile() {
  const { user }                         = useAuth();
  const { settings, patch, save }        = useSettings();
  const { hospital }                     = useTenant();
  const toast                            = useToast();
  const cfg                              = ROLE_CONFIG[user.role];
  const isAdmin                          = user.role === 'admin';
  const isStaff                          = STAFF_ROLES.includes(user.role);

  const [form, setForm] = useState({ ...settings.profile });

  /* hospital logo stored in settings.hospital for admin */
  const [hospitalLogo, setHospitalLogo] = useState(settings.hospital?.logo ?? '');

  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAvatarUpload = (dataUrl) => {
    p('avatar', dataUrl);
    toast.success('Photo ready — click Save Profile to apply');
  };

  const handleLogoUpload = (dataUrl) => {
    setHospitalLogo(dataUrl);
    toast.success('Logo ready — click Save Profile to apply');
  };

  const handleSave = () => {
    patch('profile', form);
    if (isAdmin) patch('hospital', { ...settings.hospital, logo: hospitalLogo });
    save();
    toast.success('Profile updated successfully');
  };

  return (
    <div>
      {/* ── Personal photo ── */}
      <div className="settings-section-title">Profile Photo</div>
      <p className="settings-section-desc">
        Upload a profile picture. It will appear in the sidebar and topbar across the platform.
        Max 2 MB · JPG, PNG, or WebP.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <PhotoUploader
          src={form.avatar}
          label="profile photo"
          onUpload={handleAvatarUpload}
          color={cfg.color}
          size={88}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-900)' }}>
            {user.name}
          </div>
          {/* Role badge — read-only, set by admin */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: cfg.bg, color: cfg.color, fontSize: '.73rem', fontWeight: 700,
            border: `1px solid ${cfg.color}33`,
          }}>
            {cfg.label}
          </div>
          {isStaff && (
            <p style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 6, maxWidth: 260 }}>
              Your role and department are assigned by your hospital administrator and cannot be changed here.
            </p>
          )}
        </div>
      </div>

      {/* ── Hospital logo (admin only) ── */}
      {isAdmin && (
        <>
          <div className="settings-section-title" style={{ marginTop: 8 }}>Hospital Logo</div>
          <p className="settings-section-desc">
            Upload your hospital logo. Displayed on the sidebar hospital chip and printed documents.
            Max 2 MB · PNG with transparent background recommended.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            <PhotoUploader
              src={hospitalLogo}
              label="hospital logo"
              onUpload={handleLogoUpload}
              shape="square"
              color={cfg.color}
              size={80}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-900)' }}>
                {hospital?.name ?? 'Your Hospital'}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 4 }}>
                {hospital?.city}{hospital?.state ? `, ${hospital.state}` : ''}
              </div>
              {hospitalLogo && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 8, fontSize: '.72rem' }}
                  onClick={() => { setHospitalLogo(''); toast.info('Logo removed'); }}
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Contact details ── */}
      <div className="settings-section-title">Personal Information</div>
      <p className="settings-section-desc">
        Update your contact details. Your role and department are managed by your administrator.
      </p>

      <div className="settings-grid-2">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcPerson width={14} height={14} /></div>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Your full name"
              value={form.name}
              onChange={e => p('name', e.target.value)}
            />
          </div>
        </div>

        {/* Role — read-only for all roles */}
        <div className="form-group">
          <label className="form-label">Role / Department</label>
          <div style={{
            padding: '0 14px',
            height: 40,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '.86rem',
            color: 'var(--text-500)',
          }}>
            <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
            {user.dept && <><span style={{ color: 'var(--text-300)' }}>·</span> {user.dept}</>}
            <span style={{ marginLeft: 'auto', fontSize: '.68rem', color: 'var(--text-300)', fontStyle: 'italic' }}>set by admin</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcMail width={14} height={14} /></div>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              type="email"
              placeholder="you@hospital.ng"
              value={form.email}
              onChange={e => p('email', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Phone / WhatsApp</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="+234 801 234 5678"
              value={form.phone}
              onChange={e => p('phone', e.target.value)}
            />
          </div>
        </div>

        {/* Specialisation — editable only for admin, read-only for staff */}
        {isAdmin && (
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Administrator Title</label>
            <input
              className="input"
              placeholder="e.g. Hospital Administrator, Chief Medical Officer"
              value={form.title}
              onChange={e => p('title', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Profile
        </button>
      </div>
    </div>
  );
}
