import { useState } from 'react';
import { useAuth }    from '../../context/AuthContext';
import * as Icons     from '../../components/Icons';

/* ── Tab imports ── */
import TabProfile          from './TabProfile';
import TabSecurity         from './TabSecurity';
import TabNotifications    from './TabNotifications';
import TabAppearance       from './TabAppearance';
import TabIntegrations     from './TabIntegrations';

/* Role-specific */
import TabAdminHospital    from './TabAdminHospital';
import TabAdminCompliance  from './TabAdminCompliance';
import TabSubscription     from './TabSubscription';
import TabAuditLog         from './TabAuditLog';
import TabDoctorClinical   from './TabDoctorClinical';
import TabDoctorSchedule   from './TabDoctorSchedule';
import TabNursePrefs       from './TabNursePrefs';
import TabPharmacistPrefs  from './TabPharmacistPrefs';
import TabPatientHealth    from './TabPatientHealth';
import TabPatientPrivacy   from './TabPatientPrivacy';
import TabPatientEmergency from './TabPatientEmergency';

/* ── Tab definitions per role ─────────────────────────────────
   Each tab: { key, label, icon, component }
   Grouped under section headers for the sidebar nav.
──────────────────────────────────────────────────────────────── */
const UNIVERSAL_TABS = [
  { key: 'profile',       label: 'Profile',        icon: 'IcPerson',    component: TabProfile       },
  { key: 'security',      label: 'Security',        icon: 'IcShield',    component: TabSecurity      },
  { key: 'notifications', label: 'Notifications',   icon: 'IcBell',      component: TabNotifications },
  { key: 'appearance',    label: 'Appearance',      icon: 'IcStar',      component: TabAppearance    },
  { key: 'integrations',  label: 'Integrations',    icon: 'IcWifi',      component: TabIntegrations  },
];

const ROLE_SECTIONS = {
  admin: [
    {
      section: 'Account',
      tabs: UNIVERSAL_TABS,
    },
    {
      section: 'Hospital Administration',
      tabs: [
        { key: 'hospital',      label: 'Hospital Profile',  icon: 'IcHospital', component: TabAdminHospital   },
        { key: 'subscription',  label: 'Subscription',      icon: 'IcStar',     component: TabSubscription    },
        { key: 'audit-log',     label: 'Audit Log',          icon: 'IcShield',   component: TabAuditLog        },
        { key: 'compliance',    label: 'Data & Compliance',  icon: 'IcShield',   component: TabAdminCompliance },
      ],
    },
  ],
  doctor: [
    {
      section: 'Account',
      tabs: UNIVERSAL_TABS,
    },
    {
      section: 'Clinical Preferences',
      tabs: [
        { key: 'clinical',  label: 'Clinical Settings', icon: 'IcStethoscope', component: TabDoctorClinical  },
        { key: 'schedule',  label: 'My Schedule',        icon: 'IcCalendar',    component: TabDoctorSchedule  },
      ],
    },
  ],
  nurse: [
    {
      section: 'Account',
      tabs: UNIVERSAL_TABS,
    },
    {
      section: 'Work Preferences',
      tabs: [
        { key: 'registration', label: 'Registration Prefs', icon: 'IcPersonAdd', component: TabNursePrefs },
      ],
    },
  ],
  pharmacist: [
    {
      section: 'Account',
      tabs: UNIVERSAL_TABS,
    },
    {
      section: 'Pharmacy Preferences',
      tabs: [
        { key: 'pharmacy', label: 'Dispensing & Stock', icon: 'IcPill', component: TabPharmacistPrefs },
      ],
    },
  ],
  patient: [
    {
      section: 'Account',
      tabs: UNIVERSAL_TABS,
    },
    {
      section: 'My Health',
      tabs: [
        { key: 'health',    label: 'Health Profile',     icon: 'IcFileMedical', component: TabPatientHealth    },
        { key: 'privacy',   label: 'Privacy Controls',   icon: 'IcShield',      component: TabPatientPrivacy   },
        { key: 'emergency', label: 'Emergency Contacts', icon: 'IcPhone',       component: TabPatientEmergency },
      ],
    },
  ],
};

/* Resolve icon component by name */
const Ic = (name, props = {}) => {
  const C = Icons[name];
  return C ? <C width={15} height={15} {...props} /> : null;
};

/* ════════════════════════════════════════════════════════════
   SETTINGS PAGE
════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user } = useAuth();
  const sections = ROLE_SECTIONS[user?.role] ?? ROLE_SECTIONS.admin;

  /* Default to first tab */
  const firstTab = sections[0]?.tabs[0]?.key ?? 'profile';
  const [activeTab, setActiveTab] = useState(firstTab);

  /* Find the active component */
  const allTabs = sections.flatMap(s => s.tabs);
  const active  = allTabs.find(t => t.key === activeTab) ?? allTabs[0];
  const Content = active?.component ?? (() => null);

  return (
    <div className="settings-shell anim-fade-in">

      {/* ── Left sidebar nav ── */}
      <aside data-tour="settings-sidebar" className="settings-sidebar">
        <div className="settings-sidebar-header">
          <Icons.IcGear width={16} height={16} style={{ color: 'var(--primary)' }} />
          <span>Settings</span>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {sections.map(({ section, tabs }) => (
            <div key={section} style={{ marginBottom: 4 }}>
              <div className="settings-nav-section">{section}</div>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  data-tour={`settings-${tab.key}`}
                  className={`settings-nav-item${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={activeTab === tab.key ? 'page' : undefined}
                >
                  {Ic(tab.icon)}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Right content area ── */}
      <div className="settings-content">
        <div className="settings-content-inner">
          <Content />
        </div>
      </div>
    </div>
  );
}
