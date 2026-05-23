import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import { IcCheckCircle, IcPersonAdd } from '../../components/Icons';

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const SHIFTS       = ['Morning (6am – 2pm)','Afternoon (2pm – 10pm)','Night (10pm – 6am)','Day (8am – 5pm)'];

function ToggleField({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: '.87rem', fontWeight: 600, color: 'var(--text-900)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? 'var(--primary)' : 'var(--border-dark)',
          position: 'relative', transition: 'background var(--t)',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left var(--t)',
        }} />
      </button>
    </div>
  );
}

export default function TabNursePrefs() {
  const { settings, patch, save } = useSettings();
  const toast = useToast();

  const [form, setForm]   = useState({ ...settings.registration });
  const [shift, setShift] = useState(settings.profile?.shift ?? SHIFTS[0]);

  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    patch('registration', form);
    patch('profile', { ...settings.profile, shift });
    save();
    toast.success('Preferences saved');
  };

  return (
    <div>
      {/* ── Shift ─────────────────────────────────────────── */}
      <div className="settings-section-title">Shift Preference</div>
      <p className="settings-section-desc">
        Your preferred working shift. Used for scheduling and notification timing.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {SHIFTS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setShift(s)}
            style={{
              padding: '9px 16px', borderRadius: 'var(--radius-full)', fontSize: '.82rem',
              border: `2px solid ${shift === s ? 'var(--teal)' : 'var(--border)'}`,
              background: shift === s ? 'var(--teal)' : 'var(--surface)',
              color: shift === s ? 'white' : 'var(--text-700)',
              fontWeight: shift === s ? 700 : 400,
              cursor: 'pointer', transition: 'all var(--t)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Registration defaults ─────────────────────────── */}
      <div className="settings-section-title">Registration Form Defaults</div>
      <p className="settings-section-desc">
        Pre-fill these values on the patient registration form to speed up data entry.
      </p>

      <div className="settings-grid-2" style={{ maxWidth: 480, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Default State</label>
          <select className="select" value={form.defaultState} onChange={e => p('defaultState', e.target.value)}>
            <option value="">None (leave blank)</option>
            {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Default Blood Group</label>
          <select className="select" value={form.defaultBloodGroup} onChange={e => p('defaultBloodGroup', e.target.value)}>
            <option value="">None (leave blank)</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        <ToggleField
          label="Auto-generate Patient ID"
          desc="Automatically assign the next ID (PT-YYYY-XXXX) on registration."
          checked={form.autoGenerateId}
          onChange={v => p('autoGenerateId', v)}
        />
        <ToggleField
          label="Require Insurance Information"
          desc="Make insurance fields mandatory before completing registration."
          checked={form.requireInsurance}
          onChange={v => p('requireInsurance', v)}
        />
        <ToggleField
          label="Require NIN"
          desc="National Identification Number is mandatory for new patients."
          checked={form.requireNin}
          onChange={v => p('requireNin', v)}
        />
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Preferences
        </button>
      </div>
    </div>
  );
}
