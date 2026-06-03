import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import { IcCheckCircle, IcPlus, IcX, IcWarning } from '../../components/Icons';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENOTYPES    = ['AA','AS','SS','AC','SC'];

function TagInput({ label, desc, items, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState('');

  const add = () => {
    const trimmed = val.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onAdd(trimmed);
    setVal('');
  };

  return (
    <div className="form-group" style={{ marginBottom: 20 }}>
      <label className="form-label">{label}</label>
      {desc && <p style={{ fontSize: '.76rem', color: 'var(--text-400)', marginBottom: 8 }}>{desc}</p>}

      {/* Tag list */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {items.map(item => (
            <span key={item} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary-light)', color: 'var(--primary-dark)',
              fontSize: '.78rem', fontWeight: 600, border: '1px solid var(--primary)33',
            }}>
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
              >
                <IcX width={11} height={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          style={{ flex: 1, maxWidth: 320 }}
          placeholder={placeholder}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" className="btn btn-outline" onClick={add}>
          <IcPlus width={13} height={13} /> Add
        </button>
      </div>
    </div>
  );
}

export default function TabPatientHealth() {
  const { settings, patch, save } = useSettings();
  const toast = useToast();

  const [form, setForm] = useState({ ...settings.health });
  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag    = (key, val) => p(key, [...(form[key] ?? []), val]);
  const removeTag = (key, val) => p(key, form[key].filter(x => x !== val));

  const handleSave = () => {
    patch('health', form);
    save();
    toast.success('Health profile updated');
  };

  return (
    <div>
      <div className="settings-section-title">Health Profile</div>
      <p className="settings-section-desc">
        Keep your health information up to date. This helps your doctors provide better care.
      </p>

      <div className="settings-grid-2" style={{ maxWidth: 480, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Blood Group</label>
          <select className="select" value={form.bloodGroup} onChange={e => p('bloodGroup', e.target.value)}>
            <option value="">Not specified</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Genotype</label>
          <select className="select" value={form.genotype} onChange={e => p('genotype', e.target.value)}>
            <option value="">Not specified</option>
            {GENOTYPES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <TagInput
        label="Allergies"
        desc="List any substances, foods or medications you are allergic to."
        placeholder="e.g. Penicillin, Peanuts, Latex"
        items={form.allergies}
        onAdd={v  => addTag('allergies', v)}
        onRemove={v => removeTag('allergies', v)}
      />

      <TagInput
        label="Existing Conditions"
        desc="Chronic or ongoing medical conditions your doctor should know about."
        placeholder="e.g. Type 2 Diabetes, Hypertension"
        items={form.conditions}
        onAdd={v  => addTag('conditions', v)}
        onRemove={v => removeTag('conditions', v)}
      />

      <TagInput
        label="Current Medications"
        desc="Medications you are currently taking (prescribed or over-the-counter)."
        placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
        items={form.medications}
        onAdd={v  => addTag('medications', v)}
        onRemove={v => removeTag('medications', v)}
      />

      {form.allergies.length > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 20,
          background: '#fee2e2', border: '1px solid #fca5a5',
          display: 'flex', gap: 8, alignItems: 'center', fontSize: '.8rem', color: '#991b1b',
        }}>
          <IcWarning width={14} height={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          Your allergy information is flagged to medical staff during every consultation and prescription.
        </div>
      )}

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Health Profile
        </button>
      </div>
    </div>
  );
}
