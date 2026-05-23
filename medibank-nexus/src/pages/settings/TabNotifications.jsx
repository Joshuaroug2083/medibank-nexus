import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import {
  IcBell, IcMail, IcPhone, IcCheckCircle,
} from '../../components/Icons';

/* ── Toggle row ───────────────────────────────────────────────── */
function ToggleRow({ label, desc, checked, onChange }) {
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
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--primary)' : 'var(--border-dark)',
          position: 'relative', flexShrink: 0, transition: 'background var(--t)',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left var(--t)', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );
}

/* ── Channel block ────────────────────────────────────────────── */
function ChannelBlock({ icon, title, color, channelKey, events, settings, onChange }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        padding: '12px 16px', background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text-900)' }}>{title}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 1 }}>
            Toggle which events trigger {title.toLowerCase()} notifications
          </div>
        </div>
      </div>
      <div style={{ padding: '4px 16px 8px' }}>
        {events.map(ev => (
          <ToggleRow
            key={ev.key}
            label={ev.label}
            desc={ev.desc}
            checked={settings[channelKey]?.[ev.key] ?? false}
            onChange={v => onChange(channelKey, ev.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

const EVENTS = [
  { key: 'appointments', label: 'Appointments',   desc: 'New bookings, changes, cancellations, reminders' },
  { key: 'prescriptions',label: 'Prescriptions',  desc: 'Rx issued, dispensed, or ready for collection'  },
  { key: 'newPatient',   label: 'New Patients',   desc: 'A new patient has been registered'               },
  { key: 'labResults',   label: 'Lab Results',    desc: 'Results have been uploaded to a patient record'  },
  { key: 'billing',      label: 'Billing',        desc: 'Payment confirmations and invoice alerts'        },
];

export default function TabNotifications() {
  const { settings, patchAndSave } = useSettings();
  const toast = useToast();

  const handleToggle = (channel, eventKey, value) => {
    patchAndSave('notifications', {
      ...settings.notifications,
      [channel]: { ...settings.notifications[channel], [eventKey]: value },
    });
    toast.info(`${value ? 'Enabled' : 'Disabled'} ${eventKey} ${channel} notifications`, { duration: 1500 });
  };

  return (
    <div>
      <div className="settings-section-title">Notification Preferences</div>
      <p className="settings-section-desc">
        Choose which events you are notified about and through which channels.
        Changes take effect immediately.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ChannelBlock
          icon={<IcBell  width={15} height={15} />}
          title="In-App Notifications"
          color="var(--primary)"
          channelKey="inApp"
          events={EVENTS}
          settings={settings.notifications}
          onChange={handleToggle}
        />
        <ChannelBlock
          icon={<IcMail  width={15} height={15} />}
          title="Email Notifications"
          color="var(--teal)"
          channelKey="email"
          events={EVENTS}
          settings={settings.notifications}
          onChange={handleToggle}
        />
        <ChannelBlock
          icon={<IcPhone width={15} height={15} />}
          title="SMS / WhatsApp Notifications"
          color="var(--warning)"
          channelKey="sms"
          events={EVENTS}
          settings={settings.notifications}
          onChange={handleToggle}
        />
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--primary-light)', border: '1px solid #bee3f8',
        fontSize: '.8rem', color: 'var(--primary-dark)',
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <IcCheckCircle width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
        All changes are saved automatically. SMS/email delivery depends on your hospital's
        messaging service configuration set by the administrator.
      </div>
    </div>
  );
}
