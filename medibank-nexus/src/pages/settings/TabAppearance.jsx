import { useSettings } from '../../context/SettingsContext';
import { useTour }     from '../../context/TourContext';
import { useAppCtx }   from '../../context/AppContext';
import { useToast }    from '../../components/Toast';
import {
  IcSun, IcMoon, IcMonitor, IcCheckCircle, IcArrowRight, IcRefresh,
} from '../../components/Icons';

function OptionCard({ icon, label, desc, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, minWidth: 130, padding: '14px 16px', textAlign: 'left',
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        cursor: 'pointer', transition: 'border-color var(--t), background var(--t)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--radius-md)',
        background: selected ? 'var(--primary)' : 'var(--surface-3)',
        color: selected ? 'white' : 'var(--text-400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '.85rem', color: selected ? 'var(--primary-dark)' : 'var(--text-900)' }}>
          {label}
        </div>
        {desc && <div style={{ fontSize: '.73rem', color: 'var(--text-400)', marginTop: 2 }}>{desc}</div>}
      </div>
      {selected && (
        <IcCheckCircle width={14} height={14} style={{ color: 'var(--primary)', marginTop: 'auto' }} />
      )}
    </button>
  );
}

const FONT_SIZES = [
  { key: 'small',  label: 'Small',  sample: 13 },
  { key: 'medium', label: 'Medium', sample: 15 },
  { key: 'large',  label: 'Large',  sample: 17 },
];

const LANGUAGES = [
  { key: 'en',  label: 'English'  },
  { key: 'yo',  label: 'Yorùbá'   },
  { key: 'ha',  label: 'Hausa'    },
  { key: 'ig',  label: 'Igbo'     },
  { key: 'pcm', label: 'Naijá (Pidgin)' },
];

export default function TabAppearance() {
  const { settings, patchAndSave } = useSettings();
  const { restartTour, resetAllTours, seenTours } = useTour();
  const { page } = useAppCtx();
  const toast = useToast();
  const ap = settings.appearance;

  const set = (key, val) => {
    patchAndSave('appearance', { [key]: val });
    if (key === 'theme')    toast.info(`Theme: ${val}`);
    if (key === 'fontSize') toast.info(`Font size: ${val}`);
    if (key === 'language') toast.info('Language preference saved');
  };

  const TOUR_PAGES = [
    { key: 'dashboard',        label: 'Dashboard' },
    { key: 'register',         label: 'Register Patient' },
    { key: 'consultation',     label: 'Consultation' },
    { key: 'pharmacy',         label: 'Rx Queue' },
    { key: 'appointments',     label: 'Appointments' },
    { key: 'analytics',        label: 'Analytics' },
    { key: 'portal',           label: 'My Health Records' },
    { key: 'staff-management', label: 'Staff Management' },
    { key: 'notifications',    label: 'Notifications' },
    { key: 'settings',         label: 'Settings' },
  ];

  return (
    <div>
      {/* ── Theme ──────────────────────────────────────────── */}
      <div className="settings-section-title">Theme</div>
      <p className="settings-section-desc">Choose how MediBank Nexus looks on your device.</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <OptionCard
          icon={<IcSun     width={18} height={18} />}
          label="Light"
          desc="Clean white interface"
          selected={ap.theme === 'light'}
          onClick={() => set('theme', 'light')}
        />
        <OptionCard
          icon={<IcMoon    width={18} height={18} />}
          label="Dark"
          desc="Easy on the eyes at night"
          selected={ap.theme === 'dark'}
          onClick={() => set('theme', 'dark')}
        />
        <OptionCard
          icon={<IcMonitor width={18} height={18} />}
          label="System"
          desc="Follows your OS setting"
          selected={ap.theme === 'system'}
          onClick={() => set('theme', 'system')}
        />
      </div>

      {/* ── Font Size ──────────────────────────────────────── */}
      <div className="settings-section-title">Font Size</div>
      <p className="settings-section-desc">Adjust the text size for better readability.</p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {FONT_SIZES.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => set('fontSize', f.key)}
            style={{
              padding: '10px 22px',
              border: `2px solid ${ap.fontSize === f.key ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              background: ap.fontSize === f.key ? 'var(--primary-light)' : 'var(--surface)',
              cursor: 'pointer', transition: 'border-color var(--t)',
              fontSize: f.sample, fontWeight: ap.fontSize === f.key ? 700 : 400,
              color: ap.fontSize === f.key ? 'var(--primary-dark)' : 'var(--text-700)',
            }}
          >
            {f.label} — Aa
          </button>
        ))}
      </div>

      {/* ── Language ────────────────────────────────────────── */}
      <div className="settings-section-title">Display Language</div>
      <p className="settings-section-desc">
        Choose your preferred interface language.
        Full translations are in progress — currently English is fully supported.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {LANGUAGES.map(l => (
          <button
            key={l.key}
            type="button"
            onClick={() => set('language', l.key)}
            style={{
              padding: '8px 16px',
              border: `2px solid ${ap.language === l.key ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-full)',
              background: ap.language === l.key ? 'var(--primary)' : 'var(--surface)',
              color:      ap.language === l.key ? 'white' : 'var(--text-700)',
              fontWeight: ap.language === l.key ? 700 : 400,
              cursor: 'pointer', fontSize: '.84rem',
              transition: 'all var(--t)',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ── Compact Mode ────────────────────────────────────── */}
      <div className="settings-section-title">Compact Mode</div>
      <p className="settings-section-desc">
        Reduces padding and spacing for smaller screens or denser information display.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          role="switch"
          aria-checked={ap.compactMode}
          onClick={() => set('compactMode', !ap.compactMode)}
          style={{
            width: 48, height: 26, borderRadius: 9999, border: 'none', cursor: 'pointer',
            background: ap.compactMode ? 'var(--primary)' : 'var(--border-dark)',
            position: 'relative', transition: 'background var(--t)',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: ap.compactMode ? 25 : 3,
            width: 20, height: 20, borderRadius: '50%', background: 'white',
            transition: 'left var(--t)', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          }} />
        </button>
        <span style={{ fontSize: '.87rem', color: 'var(--text-700)', fontWeight: 600 }}>
          Compact Mode {ap.compactMode ? 'On' : 'Off'}
        </span>
      </div>

      {/* Live preview strip */}
      <div style={{
        marginTop: 24, padding: '16px', borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-dark)', background: 'var(--surface-2)',
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
          Live Preview
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Primary', 'Success', 'Warning', 'Danger'].map((v, i) => (
            <span key={v} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '.8rem', fontWeight: 700,
              background: ['var(--primary-light)','#dcfce7','#fef3c7','#fee2e2'][i],
              color:      ['var(--primary)','var(--success)','var(--warning)','var(--danger)'][i],
            }}>
              {v}
            </span>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: 'var(--base-font-size, 15px)', color: 'var(--text-700)', lineHeight: 1.6 }}>
          Sample text at your selected font size. MediBank Nexus — Healthcare in Africa.
        </p>
      </div>

      {/* ── Tour Guide ────────────────────────────────────── */}
      <div className="settings-section-title" style={{ marginTop: 32 }}>Page Tour Guide</div>
      <p className="settings-section-desc">
        Replay a guided tour for any page. Tours auto-start the first time you visit each page.
        Use the buttons below to restart one or reset them all.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TOUR_PAGES.map(p => {
          const seen = seenTours().includes(p.key);
          return (
            <button
              key={p.key}
              className="tour-restart-btn"
              onClick={() => {
                restartTour(p.key);
                toast.info(`Tour started: ${p.label}`);
              }}
              title={seen ? 'Tour completed — click to restart' : 'Tour not yet seen'}
            >
              {seen
                ? <IcCheckCircle width={13} height={13} style={{ color: 'var(--success)' }} />
                : <IcArrowRight  width={13} height={13} />}
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        className="btn btn-outline btn-sm"
        onClick={() => {
          resetAllTours();
          toast.success('All tours reset — they will play again on your next visit to each page');
        }}
        style={{ color: 'var(--danger)', borderColor: 'var(--danger)33' }}
      >
        <IcRefresh width={13} height={13} /> Reset All Tours
      </button>
    </div>
  );
}
