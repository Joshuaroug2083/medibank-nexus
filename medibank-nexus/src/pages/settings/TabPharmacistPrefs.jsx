import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import { IcCheckCircle, IcPill, IcWarning } from '../../components/Icons';

const ROUTES = ['Oral','IV','IM','SC','Topical','Inhaled','Sublingual','Rectal','Nasal','Optic','Otic'];

function ToggleField({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ paddingRight: 16 }}>
        <div style={{ fontSize: '.87rem', fontWeight: 600, color: 'var(--text-900)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>}
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
          width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left var(--t)',
        }} />
      </button>
    </div>
  );
}

export default function TabPharmacistPrefs() {
  const { settings, patch, save } = useSettings();
  const toast = useToast();

  const [form, setForm] = useState({ ...settings.pharmacy });
  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    patch('pharmacy', form);
    save();
    toast.success('Pharmacy preferences saved');
  };

  return (
    <div>
      {/* ── Inventory alerts ──────────────────────────────── */}
      <div className="settings-section-title">Inventory Alerts</div>
      <p className="settings-section-desc">
        Set when low-stock alerts are triggered. Any drug with quantity at or below this level will be flagged.
      </p>

      <div style={{ maxWidth: 380, marginBottom: 28 }}>
        <label className="form-label">Low-Stock Alert Threshold (units)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            type="range" min={5} max={200} step={5}
            value={form.lowStockThreshold}
            onChange={e => p('lowStockThreshold', parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--warning)', cursor: 'pointer' }}
          />
          <div style={{
            minWidth: 58, padding: '6px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center',
            background: form.lowStockThreshold <= 20 ? '#fee2e2' : form.lowStockThreshold <= 50 ? '#fef3c7' : '#dcfce7',
            color:      form.lowStockThreshold <= 20 ? 'var(--danger)' : form.lowStockThreshold <= 50 ? 'var(--warning)' : 'var(--success)',
            fontWeight: 800, fontSize: '.9rem',
          }}>
            {form.lowStockThreshold}
          </div>
        </div>
        <div style={{ fontSize: '.73rem', color: 'var(--text-400)', marginTop: 6 }}>
          Current setting: alert when stock falls to <strong>{form.lowStockThreshold} units</strong> or fewer.
        </div>

        {/* Alert preview */}
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)',
          border: '1px solid #fde68a', background: '#fffbeb',
          display: 'flex', gap: 8, alignItems: 'center', fontSize: '.78rem', color: '#92400e',
        }}>
          <IcWarning width={13} height={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          Example: "Amlodipine 5mg — only {form.lowStockThreshold - 5} units remaining"
        </div>
      </div>

      {/* ── Dispensing Preferences ────────────────────────── */}
      <div className="settings-section-title">Dispensing Preferences</div>

      <div style={{ maxWidth: 520, marginBottom: 20 }}>
        <ToggleField
          label="Alert on Low Stock"
          desc="Show a warning badge on prescriptions containing low-stock drugs."
          checked={form.alertOnLowStock}
          onChange={v => p('alertOnLowStock', v)}
        />
        <ToggleField
          label="Require Double-Check on Dispense"
          desc="Show a confirmation dialog before finalising each prescription dispense."
          checked={form.requireDoubleCheck}
          onChange={v => p('requireDoubleCheck', v)}
        />
        <ToggleField
          label="Show Dispensing Notes"
          desc="Display patient-facing notes field when dispensing (e.g. 'Take with food')."
          checked={form.dispensingNotes}
          onChange={v => p('dispensingNotes', v)}
        />
      </div>

      {/* ── Default Route ─────────────────────────────────── */}
      <div className="settings-section-title">Default Route of Administration</div>
      <p className="settings-section-desc">Pre-selected route when adding a new drug to a prescription.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {ROUTES.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => p('defaultRoute', r)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-full)', fontSize: '.8rem',
              border: `2px solid ${form.defaultRoute === r ? 'var(--warning)' : 'var(--border)'}`,
              background: form.defaultRoute === r ? 'var(--warning)' : 'var(--surface)',
              color: form.defaultRoute === r ? 'white' : 'var(--text-700)',
              fontWeight: form.defaultRoute === r ? 700 : 400,
              cursor: 'pointer', transition: 'all var(--t)',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Preferences
        </button>
      </div>
    </div>
  );
}
