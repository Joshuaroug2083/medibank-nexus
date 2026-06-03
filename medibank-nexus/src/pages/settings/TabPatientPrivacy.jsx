import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import {
  IcShield, IcCheckCircle, IcPerson, IcPill, IcCPU, IcPeople,
} from '../../components/Icons';

function PrivacyCard({ icon, color, title, desc, checked, onChange }) {
  return (
    <div style={{
      background: 'var(--surface)', border: `2px solid ${checked ? color : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
      transition: 'border-color var(--t)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-900)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '.77rem', color: 'var(--text-400)', lineHeight: 1.6 }}>{desc}</div>
      </div>
      <button
        role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? color : 'var(--border-dark)',
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

export default function TabPatientPrivacy() {
  const { settings, patchAndSave } = useSettings();
  const toast = useToast();

  const priv = settings.privacy;

  const set = (key, val) => {
    patchAndSave('privacy', { [key]: val });
    toast.info(val ? 'Access granted' : 'Access restricted', { duration: 1500 });
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--teal))',
        borderRadius: 'var(--radius-lg)', padding: '16px 18px',
        display: 'flex', gap: 12, alignItems: 'center', color: 'white', marginBottom: 24,
      }}>
        <IcShield width={22} height={22} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '.9rem' }}>Your Data, Your Control</div>
          <div style={{ fontSize: '.77rem', opacity: .85, marginTop: 3, lineHeight: 1.5 }}>
            Under the NDPR, you have the right to control who can access your health information.
            All changes take effect immediately.
          </div>
        </div>
      </div>

      <div className="settings-section-title">Access Permissions</div>
      <p className="settings-section-desc">
        Choose which healthcare professionals can access your full medical record.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <PrivacyCard
          icon={<IcPerson width={18} height={18} />}
          color="var(--primary)"
          title="Doctors"
          desc="Doctors can view your full medical history, test results, diagnosis, and prescriptions. Strongly recommended to keep this ON for your safety."
          checked={priv.shareWithDoctors}
          onChange={v => set('shareWithDoctors', v)}
        />
        <PrivacyCard
          icon={<IcPill width={18} height={18} />}
          color="var(--warning)"
          title="Pharmacists"
          desc="Pharmacists can see your active prescriptions, allergies, and current medications to safely dispense drugs."
          checked={priv.shareWithPharmacists}
          onChange={v => set('shareWithPharmacists', v)}
        />
        <PrivacyCard
          icon={<IcCPU width={18} height={18} />}
          color="var(--teal)"
          title="Nexus AI Assistant"
          desc="Allow the AI assistant to reference your health profile when answering your questions. Your data is never sent to third parties."
          checked={priv.allowAiAccess}
          onChange={v => set('allowAiAccess', v)}
        />
        <PrivacyCard
          icon={<IcPeople width={18} height={18} />}
          color="#374151"
          title="Staff Directory Visibility"
          desc="Allow hospital staff to see your name in the patient directory when looking up appointments."
          checked={priv.showInStaffDirectory}
          onChange={v => set('showInStaffDirectory', v)}
        />
      </div>

      <div style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        fontSize: '.78rem', color: 'var(--text-500)', lineHeight: 1.6,
      }}>
        <strong>Note:</strong> Restricting doctor access may affect the quality of care you receive
        during consultations. Emergency staff always retain access to your allergies and blood group
        regardless of these settings.
      </div>
    </div>
  );
}
