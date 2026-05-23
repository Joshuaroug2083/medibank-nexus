import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import {
  IcStethoscope, IcCheckCircle, IcCPU, IcArrowUp, IcArrowDown,
} from '../../components/Icons';

const VITALS_LABELS = {
  bp:     'Blood Pressure',
  pulse:  'Pulse Rate',
  temp:   'Temperature',
  spo2:   'SpO₂',
  rr:     'Respiratory Rate',
  weight: 'Weight',
};

const AI_MODELS = [
  { key: 'claude',  label: 'Claude (Anthropic)',  desc: 'Default · Best clinical accuracy',     badge: 'Recommended' },
  { key: 'gpt4',    label: 'GPT-4o (OpenAI)',      desc: 'Strong general reasoning',             badge: null },
  { key: 'gemini',  label: 'Gemini 1.5 (Google)',  desc: 'Great for long documents',             badge: null },
];

const DURATIONS = [10, 15, 20, 30, 45, 60];

export default function TabDoctorClinical() {
  const { settings, patch, save } = useSettings();
  const toast = useToast();

  const [form, setForm] = useState({ ...settings.clinical });
  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* Drag-free reorder for vitals */
  const moveVital = (idx, dir) => {
    const arr = [...form.vitalsOrder];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    p('vitalsOrder', arr);
  };

  const handleSave = () => {
    patch('clinical', form);
    save();
    toast.success('Clinical preferences saved');
  };

  return (
    <div>
      {/* ── AI Assistant ─────────────────────────────────── */}
      <div className="settings-section-title">AI Assistant</div>
      <p className="settings-section-desc">
        Choose the AI model that powers Nexus AI during consultations.
        You will be able to enter your own API key in the Integrations tab.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, maxWidth: 480 }}>
        {AI_MODELS.map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => p('preferredAiModel', m.key)}
            style={{
              padding: '13px 16px', textAlign: 'left',
              border: `2px solid ${form.preferredAiModel === m.key ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              background: form.preferredAiModel === m.key ? 'var(--primary-light)' : 'var(--surface)',
              cursor: 'pointer', transition: 'border-color var(--t)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: form.preferredAiModel === m.key ? 'var(--primary)' : 'var(--surface-3)',
              color: form.preferredAiModel === m.key ? 'white' : 'var(--text-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IcCPU width={16} height={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text-900)', display: 'flex', gap: 8, alignItems: 'center' }}>
                {m.label}
                {m.badge && (
                  <span style={{ fontSize: '.66rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-full)',
                    background: 'var(--success)', color: 'white' }}>
                    {m.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2 }}>{m.desc}</div>
            </div>
            {form.preferredAiModel === m.key && (
              <IcCheckCircle width={16} height={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      {/* AI toggles */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
        {[
          { key: 'autoSummarize',     label: 'Auto-generate clinical summary after consultation' },
          { key: 'aiAssistOnConsult', label: 'Show AI assistant panel during consultations'      },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '.85rem', color: 'var(--text-700)', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form[key]}
              onChange={e => p(key, e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            {label}
          </label>
        ))}
      </div>

      {/* ── Default Appointment Duration ──────────────────── */}
      <div className="settings-section-title">Default Appointment Duration</div>
      <p className="settings-section-desc">How long is each consultation slot by default.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {DURATIONS.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => p('defaultDuration', d)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--radius-full)', fontSize: '.84rem',
              border: `2px solid ${form.defaultDuration === d ? 'var(--primary)' : 'var(--border)'}`,
              background: form.defaultDuration === d ? 'var(--primary)' : 'var(--surface)',
              color: form.defaultDuration === d ? 'white' : 'var(--text-700)',
              fontWeight: form.defaultDuration === d ? 700 : 400,
              cursor: 'pointer', transition: 'all var(--t)',
            }}
          >
            {d} min
          </button>
        ))}
      </div>

      {/* ── Vitals order ─────────────────────────────────── */}
      <div className="settings-section-title">Vitals Display Order</div>
      <p className="settings-section-desc">Drag or use arrows to reorder how vitals appear on the consultation form.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, marginBottom: 24 }}>
        {form.vitalsOrder.map((v, i) => (
          <div key={v} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)', width: 18, textAlign: 'center' }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: '.85rem', fontWeight: 600, color: 'var(--text-900)' }}>
              {VITALS_LABELS[v]}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="icon-btn" disabled={i === 0}   onClick={() => moveVital(i, -1)} style={{ opacity: i === 0 ? .3 : 1 }}>
                <IcArrowUp   width={13} height={13} />
              </button>
              <button className="icon-btn" disabled={i === form.vitalsOrder.length - 1} onClick={() => moveVital(i, 1)} style={{ opacity: i === form.vitalsOrder.length - 1 ? .3 : 1 }}>
                <IcArrowDown width={13} height={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── SOAP Default Template ─────────────────────────── */}
      <div className="settings-section-title">Default SOAP Note Template</div>
      <p className="settings-section-desc">
        Pre-fill your SOAP note fields with this template when starting a new consultation.
      </p>

      <textarea
        className="input"
        style={{ minHeight: 120, fontFamily: 'var(--font-mono, monospace)', fontSize: '.82rem', resize: 'vertical', maxWidth: 540 }}
        placeholder="S: Patient presents with…&#10;O: Vitals WNL…&#10;A: Diagnosis…&#10;P: Plan includes…"
        value={form.soapTemplate}
        onChange={e => p('soapTemplate', e.target.value)}
      />

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Clinical Preferences
        </button>
      </div>
    </div>
  );
}
