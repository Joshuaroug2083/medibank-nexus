import { useState }  from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTenant }   from '../../context/TenantContext';
import { useToast }    from '../../components/Toast';
import { TIER_CONFIG } from '../../data/mockHospitals';
import {
  IcHospital, IcMail, IcPhone, IcCheckCircle, IcBarChart,
  IcShield, IcGear, IcPeople, IcEdit,
} from '../../components/Icons';

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const BRAND_COLORS = [
  { label: 'Nexus Blue',   value: '#0a6ebd' },
  { label: 'Medical Teal', value: '#0d9488' },
  { label: 'Deep Purple',  value: '#7c3aed' },
  { label: 'Forest Green', value: '#059669' },
  { label: 'Crimson',      value: '#dc2626' },
  { label: 'Slate',        value: '#374151' },
  { label: 'Amber',        value: '#d97706' },
  { label: 'Rose',         value: '#e11d48' },
];

export default function TabAdminHospital() {
  const { settings, patch, save } = useSettings();
  const { hospital, setTenant }   = useTenant();
  const toast = useToast();

  const [form, setForm] = useState({
    name:         hospital?.name         ?? '',
    phone:        hospital?.phone        ?? '',
    email:        hospital?.email        ?? '',
    address:      hospital?.address      ?? '',
    city:         hospital?.city         ?? '',
    state:        hospital?.state        ?? '',
    website:      settings.hospital?.website ?? '',
    primaryColor: hospital?.primaryColor ?? '#0a6ebd',
  });

  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    patch('hospital', form);
    save();
    /* Update tenant context so topbar/sidebar reflect changes immediately */
    if (hospital) setTenant({ ...hospital, ...form, short_name: hospital.shortName });
    toast.success('Hospital profile updated');
  };

  const tier      = TIER_CONFIG[hospital?.tier ?? 'starter'];
  const usagePct  = tier?.maxStaff
    ? Math.min(100, Math.round(((hospital?.staffCount ?? 1) / tier.maxStaff) * 100))
    : 0;

  return (
    <div>
      {/* ── Hospital identity ────────────────────────────── */}
      <div className="settings-section-title">Hospital Profile</div>
      <p className="settings-section-desc">
        Update your facility's public information. This appears on patient-facing documents.
      </p>

      <div className="settings-grid-2">
        <div className="form-group">
          <label className="form-label">Hospital Name</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcHospital width={14} height={14} /></div>
            <input className="input" style={{ paddingLeft: 36 }}
              value={form.name} onChange={e => p('name', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Official Email</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcMail width={14} height={14} /></div>
            <input className="input" style={{ paddingLeft: 36 }} type="email"
              value={form.email} onChange={e => p('email', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
            <input className="input" style={{ paddingLeft: 36 }}
              value={form.phone} onChange={e => p('phone', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Website (optional)</label>
          <input className="input" placeholder="https://yourhospital.ng"
            value={form.website} onChange={e => p('website', e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Street Address</label>
          <input className="input"
            value={form.address} onChange={e => p('address', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="input"
            value={form.city} onChange={e => p('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <select className="select" value={form.state} onChange={e => p('state', e.target.value)}>
            <option value="">Select state…</option>
            {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Brand colour ─────────────────────────────────── */}
      <div className="settings-section-title" style={{ marginTop: 4 }}>Brand Colour</div>
      <p className="settings-section-desc">
        Your brand colour appears in the sidebar, topbar badge and patient-facing documents.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {BRAND_COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => p('primaryColor', c.value)}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: c.value,
              outline: form.primaryColor === c.value ? `3px solid ${c.value}` : '3px solid transparent',
              outlineOffset: 3,
              boxShadow: form.primaryColor === c.value ? `0 0 0 2px white, 0 0 0 5px ${c.value}` : 'none',
              transition: 'box-shadow var(--t)',
            }}
          />
        ))}

        {/* Custom colour */}
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={form.primaryColor}
            onChange={e => p('primaryColor', e.target.value)}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--border)',
              cursor: 'pointer', padding: 0, overflow: 'hidden',
            }}
            title="Custom colour"
          />
        </div>
      </div>

      {/* Colour preview */}
      <div style={{
        marginBottom: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        border: '1px solid var(--border)', maxWidth: 360,
      }}>
        <div style={{ background: form.primaryColor, padding: '14px 18px', color: 'white' }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>{form.name || 'Your Hospital'}</div>
          <div style={{ fontSize: '.75rem', opacity: .8, marginTop: 2 }}>Sidebar preview</div>
        </div>
        <div style={{ padding: '10px 16px', background: 'var(--surface-2)', display: 'flex', gap: 8 }}>
          {['Primary', 'Light', 'Button'].map((lbl, i) => (
            <div key={lbl} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '.73rem', fontWeight: 700,
              background: i === 2 ? form.primaryColor : `${form.primaryColor}18`,
              color:      i === 2 ? 'white'          : form.primaryColor,
            }}>
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* ── Subscription summary ──────────────────────────── */}
      <div className="settings-section-title">Subscription</div>
      <div style={{
        background: 'var(--surface)', border: `2px solid ${tier?.color ?? 'var(--border)'}22`,
        borderRadius: 'var(--radius-lg)', padding: '16px 18px', maxWidth: 440,
        boxShadow: 'var(--shadow-sm)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-900)' }}>
              {tier?.label ?? 'Starter'} Plan
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-400)', marginTop: 2 }}>
              {tier?.price ?? '₦25,000/mo'}
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: `${tier?.color}18`, color: tier?.color,
            fontSize: '.73rem', fontWeight: 700,
            border: `1px solid ${tier?.color}33`,
          }}>
            {hospital?.status === 'trial' ? 'Trial' : 'Active'}
          </span>
        </div>

        {tier?.maxStaff && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-500)' }}>Staff seats</span>
              <span style={{ fontWeight: 700 }}>{hospital?.staffCount ?? 1} / {tier.maxStaff}</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 9999,
                width: `${usagePct}%`,
                background: usagePct >= 90 ? 'var(--danger)' : usagePct >= 70 ? 'var(--warning)' : tier.color,
                transition: 'width .4s',
              }} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <button className="btn btn-outline" style={{ borderColor: tier?.color, color: tier?.color }}>
            <IcBarChart width={13} height={13} /> Upgrade Plan
          </button>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Hospital Profile
        </button>
      </div>
    </div>
  );
}
