import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import {
  IcShield, IcCheckCircle, IcWarning, IcDownload, IcTrash,
} from '../../components/Icons';

function ToggleRow({ label, desc, checked, onChange, danger }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ paddingRight: 16 }}>
        <div style={{ fontSize: '.87rem', fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--text-900)' }}>
          {label}
        </div>
        <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? (danger ? 'var(--danger)' : 'var(--primary)') : 'var(--border-dark)',
          position: 'relative', transition: 'background var(--t)',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left var(--t)', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );
}

const RETENTION_OPTIONS = [
  { value: 12,  label: '1 year'   },
  { value: 24,  label: '2 years'  },
  { value: 60,  label: '5 years'  },
  { value: 84,  label: '7 years (NDPR recommended)' },
  { value: 120, label: '10 years' },
];

export default function TabAdminCompliance() {
  const { settings, patchAndSave } = useSettings();
  const toast   = useToast();
  const comp    = settings.compliance;

  const set = (key, val) => {
    patchAndSave('compliance', { [key]: val });
  };

  const handleExportData = () => {
    toast.info('Data export started — you will receive a download link via email.');
  };

  const handleDeleteRequest = () => {
    toast.error('For data deletion requests, contact support@medibanknexus.com with your hospital license number.');
  };

  return (
    <div>
      {/* ── NDPR compliance badge ──────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--teal))',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14, color: 'white', marginBottom: 26,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IcShield width={22} height={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.95rem' }}>NDPR Compliant Platform</div>
          <div style={{ fontSize: '.78rem', opacity: .85, marginTop: 3, lineHeight: 1.5 }}>
            MediBank Nexus is built in compliance with Nigeria's Data Protection Regulation (NDPR 2019).
            All patient data is encrypted at rest and in transit.
          </div>
        </div>
      </div>

      {/* ── Data Retention ────────────────────────────────── */}
      <div className="settings-section-title">Data Retention</div>
      <p className="settings-section-desc">
        How long patient records are retained before anonymisation.
        NDPR recommends a minimum of 7 years for medical records.
      </p>

      <div className="form-group" style={{ maxWidth: 340, marginBottom: 24 }}>
        <label className="form-label">Retention Period</label>
        <select
          className="select"
          value={comp.dataRetentionMonths}
          onChange={e => set('dataRetentionMonths', parseInt(e.target.value))}
        >
          {RETENTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Privacy Controls ──────────────────────────────── */}
      <div className="settings-section-title">Privacy Controls</div>

      <div style={{ maxWidth: 560 }}>
        <ToggleRow
          label="Require Patient Consent on Registration"
          desc="Staff must record that the patient has consented to their data being stored and processed."
          checked={comp.requireConsentOnRegister}
          onChange={v => set('requireConsentOnRegister', v)}
        />
        <ToggleRow
          label="Full Audit Logging"
          desc="Every record access, modification, and deletion is logged with user ID and timestamp."
          checked={comp.auditAllAccess}
          onChange={v => set('auditAllAccess', v)}
        />
        <ToggleRow
          label="Allow Data Export"
          desc="Permit staff to export patient data to PDF. Disable to lock down exports."
          checked={comp.exportEnabled}
          onChange={v => set('exportEnabled', v)}
        />
        <ToggleRow
          label="Anonymise After Retention Period"
          desc="Automatically anonymise patient PII (name, NIN, phone) after the retention period."
          checked={comp.anonymizeAfterRetention}
          onChange={v => set('anonymizeAfterRetention', v)}
        />
      </div>

      {/* ── Data Rights ────────────────────────────────────── */}
      <div className="settings-section-title" style={{ marginTop: 8 }}>Data Rights (NDPR Article 3.1)</div>
      <p className="settings-section-desc">
        Under the NDPR, your patients have the right to access, correct, and request deletion of their data.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button className="btn btn-outline" onClick={handleExportData}>
          <IcDownload width={14} height={14} /> Export All Patient Data
        </button>
        <button
          className="btn btn-outline"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          onClick={handleDeleteRequest}
        >
          <IcTrash width={14} height={14} /> Request Data Deletion
        </button>
      </div>

      {/* ── Notice ─────────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: '#fffbeb', border: '1px solid #fde68a',
        fontSize: '.8rem', color: '#92400e', display: 'flex', gap: 10, maxWidth: 520,
      }}>
        <IcWarning width={14} height={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }} />
        <span>
          Changes to compliance settings are logged in the audit trail and cannot be undone.
          Contact <strong>support@medibanknexus.com</strong> if you need assistance with a regulatory inquiry.
        </span>
      </div>
    </div>
  );
}
