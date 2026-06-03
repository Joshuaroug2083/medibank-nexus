import { useState }          from 'react';
import { useIntegrations }   from '../../context/IntegrationsContext';
import { useToast }           from '../../components/Toast';
import { downloadICS }        from '../../lib/icsExport';
import {
  IcCalendar, IcCPU, IcFileMedical, IcCheckCircle, IcArrowRight,
  IcGoogle, IcEye, IcEyeOff, IcX, IcWarning, IcDownload,
} from '../../components/Icons';

/* ── Helpers ─────────────────────────────────────────────────── */
const GOOGLE_SCOPES_LABELS = {
  'https://www.googleapis.com/auth/calendar':       'Google Calendar',
  'https://www.googleapis.com/auth/drive.file':     'Google Drive',
  'https://www.googleapis.com/auth/documents':      'Google Docs',
};

/* ── AI Provider definitions ──────────────────────────────────── */
const AI_PROVIDERS = [
  {
    key:    'anthropic',
    name:   'Claude (Anthropic)',
    model:  'claude-sonnet-4-6',
    color:  '#d4a853',
    bg:     '#fef9ee',
    badge:  'Default',
    badgeColor: '#b45309',
    badgeBg:    '#fef3c7',
    desc:   'Best clinical accuracy. Powers Nexus AI by default. Ideal for SOAP notes, summaries, drug queries.',
    keyPlaceholder: 'sk-ant-api03-...',
    docsUrl: null,
  },
  {
    key:    'openai',
    name:   'GPT-4o (OpenAI)',
    model:  'gpt-4o',
    color:  '#10a37f',
    bg:     '#f0fdf4',
    badge:  null,
    desc:   'Strong general reasoning. Great for structured outputs and complex instruction-following.',
    keyPlaceholder: 'sk-...',
    docsUrl: null,
  },
  {
    key:    'google',
    name:   'Gemini 1.5 Pro (Google)',
    model:  'gemini-1.5-pro',
    color:  '#4285f4',
    bg:     '#e8f0fe',
    badge:  null,
    desc:   'Excellent for long documents and multimodal tasks. Supports large context windows.',
    keyPlaceholder: 'AIzaSy...',
    docsUrl: null,
  },
];

/* ── Google Services list ─────────────────────────────────────── */
const GOOGLE_SERVICES = [
  {
    icon:  <IcCalendar width={18} height={18} />,
    color: '#4285f4',
    bg:    '#e8f0fe',
    name:  'Google Calendar',
    desc:  'Sync appointments. Device alarms fire 30 min and 1 hour before each consultation.',
  },
  {
    icon:  <IcFileMedical width={18} height={18} />,
    color: '#34a853',
    bg:    '#e6f4ea',
    name:  'Google Drive',
    desc:  'Export patient records, prescriptions and consultation summaries as PDFs to your Drive.',
  },
  {
    icon:  <IcCheckCircle width={18} height={18} />,
    color: '#1a73e8',
    bg:    '#e8f0fe',
    name:  'Google Docs',
    desc:  'Send clinical notes and AI summaries to a new Google Doc with one click.',
  },
];

/* ── Sub-component: AiProviderCard ───────────────────────────── */
function AiProviderCard({ provider }) {
  const { saveAiKey, clearAiKey, testAiConnection, hasAiKey, loading } = useIntegrations();
  const toast = useToast();

  const [key,        setKey]        = useState('');
  const [showKey,    setShowKey]    = useState(false);
  const [testResult, setTestResult] = useState(null); // null | { success, message }

  const saved     = hasAiKey(provider.key);
  const isSaving  = loading[`aiKey_${provider.key}`];
  const isTesting = loading[`aiTest_${provider.key}`];

  const handleSave = async () => {
    if (!key.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    const result = await saveAiKey(provider.key, key.trim());
    if (result.success) {
      toast.success(`${provider.name} key saved`);
      setKey('');
    } else {
      toast.error(result.error ?? 'Failed to save key');
    }
  };

  const handleClear = async () => {
    await clearAiKey(provider.key);
    setTestResult(null);
    toast.info(`${provider.name} key removed`);
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await testAiConnection(provider.key);
    setTestResult(result);
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: `2px solid ${saved ? provider.color + '55' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 18px',
      transition: 'border-color var(--t)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: provider.bg, color: provider.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '.78rem', letterSpacing: '-.01em',
        }}>
          <IcCPU width={20} height={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text-900)' }}>
              {provider.name}
            </span>
            {provider.badge && (
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: provider.badgeBg, color: provider.badgeColor,
              }}>
                {provider.badge}
              </span>
            )}
            {saved && (
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: '#dcfce7', color: '#166534',
              }}>
                ✓ Key saved
              </span>
            )}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 2 }}>
            {provider.model}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '.78rem', color: 'var(--text-400)', lineHeight: 1.65, marginBottom: 12 }}>
        {provider.desc}
      </p>

      {/* Key input row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <input
            className="input"
            type={showKey ? 'text' : 'password'}
            placeholder={saved ? '••••••••••••••••••••' : provider.keyPlaceholder}
            value={key}
            onChange={e => setKey(e.target.value)}
            style={{ paddingRight: 36 }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-400)', display: 'flex',
            }}
          >
            {showKey
              ? <IcEyeOff width={14} height={14} />
              : <IcEye    width={14} height={14} />}
          </button>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={isSaving || !key.trim()}
          style={{ flexShrink: 0 }}
        >
          {isSaving ? 'Saving…' : 'Save Key'}
        </button>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {saved && (
          <>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? 'Testing…' : 'Test Connection'}
            </button>
            <button
              className="btn btn-sm"
              onClick={handleClear}
              style={{ color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)33' }}
            >
              <IcX width={11} height={11} /> Remove Key
            </button>
          </>
        )}
        {!saved && (
          <span style={{ fontSize: '.74rem', color: 'var(--text-400)' }}>
            {provider.key === 'anthropic'
              ? 'Using platform default key — add your own for higher rate limits'
              : 'No key saved — this provider will not be available'}
          </span>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)',
          fontSize: '.77rem', display: 'flex', alignItems: 'center', gap: 6,
          background: testResult.success ? '#dcfce7' : '#fee2e2',
          color:      testResult.success ? '#166534' : '#991b1b',
          border:     `1px solid ${testResult.success ? '#86efac' : '#fca5a5'}`,
        }}>
          {testResult.success
            ? <IcCheckCircle width={13} height={13} />
            : <IcWarning     width={13} height={13} />}
          {testResult.message}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN TAB
════════════════════════════════════════════════════════════ */
export default function TabIntegrations() {
  const { google, loading, connectGoogle, disconnectGoogle } = useIntegrations();
  const toast = useToast();

  /* Demo appointments for ICS export preview */
  const demoAppointments = [
    {
      id:            'demo-1',
      title:         'Follow-up Consultation',
      scheduled_at:  new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 30,
      patient_name:  'Sample Patient',
      doctor_name:   'Your Doctor',
      status:        'confirmed',
      notes:         'Bring all current medications',
    },
  ];

  const handleConnectGoogle = async () => {
    const result = await connectGoogle();
    if (result?.success) {
      toast.success(`Google account connected — ${result.email}`);
    } else if (result?.reason === 'closed') {
      toast.info('Google connection cancelled');
    } else if (result?.reason !== 'timeout') {
      toast.error(result?.reason ?? 'Failed to connect Google account');
    }
  };

  const handleDisconnectGoogle = async () => {
    await disconnectGoogle();
    toast.info('Google account disconnected');
  };

  const handleExportICS = () => {
    downloadICS(demoAppointments);
    toast.success('Calendar file downloaded — open it to import into any calendar app');
  };

  return (
    <div>

      {/* ── Google Services ──────────────────────────────── */}
      <div className="settings-section-title">Google Services</div>
      <p className="settings-section-desc">
        Connect your Google account to unlock Calendar sync with device alarms,
        Drive exports, and one-click Docs generation.
        One connection grants access to all three services.
      </p>

      {/* Google connection card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        marginBottom: 16, boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <IcGoogle width={32} height={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '.92rem', color: 'var(--text-900)' }}>
              Google Account
            </div>
            {google.connected ? (
              <div style={{ fontSize: '.78rem', color: 'var(--success)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <IcCheckCircle width={12} height={12} />
                Connected as <strong style={{ marginLeft: 3 }}>{google.email}</strong>
              </div>
            ) : (
              <div style={{ fontSize: '.78rem', color: 'var(--text-400)', marginTop: 2 }}>
                Not connected
              </div>
            )}
          </div>
          {google.connected ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleDisconnectGoogle}
              disabled={loading.googleDisconnect}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)33', flexShrink: 0 }}
            >
              {loading.googleDisconnect ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleConnectGoogle}
              disabled={loading.google}
              style={{ flexShrink: 0 }}
            >
              {loading.google ? 'Connecting…' : (
                <><IcGoogle width={13} height={13} /> Connect Google</>
              )}
            </button>
          )}
        </div>

        {/* Service list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOOGLE_SERVICES.map(svc => (
            <div key={svc.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              opacity: google.connected ? 1 : 0.55,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: svc.bg, color: svc.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {svc.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>
                    {svc.name}
                  </span>
                  {google.connected && (
                    <span style={{
                      fontSize: '.64rem', fontWeight: 700, padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: '#dcfce7', color: '#166534',
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2, lineHeight: 1.5 }}>
                  {svc.desc}
                </div>
              </div>
              {google.connected && (
                <IcCheckCircle width={16} height={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {!google.connected && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)', border: '1px solid var(--primary)22',
            fontSize: '.77rem', color: 'var(--primary-dark)',
          }}>
            <strong>Setup required:</strong> You need a Google Cloud project with OAuth2 credentials
            configured. See your system administrator or the Setup Guide in the Help section.
          </div>
        )}
      </div>

      {/* ICS Export — works without Google */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 18px',
        marginBottom: 28, display: 'flex', gap: 14, alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e8f0fe', color: '#4285f4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IcCalendar width={20} height={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text-900)' }}>
            Export Calendar (.ics)
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 2, lineHeight: 1.5 }}>
            Download your appointments as an .ics file — compatible with Google Calendar,
            Apple Calendar, Outlook and any calendar app. Includes 30-min device alarms.
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleExportICS}
          style={{ flexShrink: 0 }}
        >
          <IcDownload width={13} height={13} /> Export .ics
        </button>
      </div>

      {/* ── AI Model & API Keys ───────────────────────────── */}
      <div className="settings-section-title">AI Model & API Keys</div>
      <p className="settings-section-desc">
        MediBank Nexus uses Claude by default. Bring your own API key to switch providers,
        increase rate limits, or use a custom model version.
        Keys are stored AES-256 encrypted on our servers — never exposed in plaintext.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {AI_PROVIDERS.map(p => (
          <AiProviderCard key={p.key} provider={p} />
        ))}
      </div>

      {/* Security note */}
      <div style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        fontSize: '.77rem', color: 'var(--text-500)', lineHeight: 1.65,
        display: 'flex', gap: 10,
      }}>
        <IcWarning width={14} height={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }} />
        <div>
          <strong>Your API keys are private.</strong> They are encrypted with AES-256-GCM before
          being stored and are never logged, never shared, and never visible after saving.
          The keys are only used server-side to proxy your AI requests securely.
          You can remove any key at any time.
        </div>
      </div>
    </div>
  );
}
