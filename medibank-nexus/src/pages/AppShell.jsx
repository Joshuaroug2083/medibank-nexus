import { useState, useEffect, useRef } from 'react';
import { useAuth }         from '../context/AuthContext';
import { useAppCtx }       from '../context/AppContext';
import { useSettings }     from '../context/SettingsContext';
import { useTour }         from '../context/TourContext';
import TOUR_DEFS           from '../data/tourDefs';
import { useTenant }   from '../context/TenantContext';
import { useToast }    from '../components/Toast';
import { ROLE_CONFIG } from '../data/mockUsers';
import { NAV_CONFIG, PAGE_TITLES } from '../data/navConfig';
import Avatar        from '../components/Avatar';
import StatCard      from '../components/StatCard';
import RegisterPage      from './RegisterPage';
import ConsultationPage from './ConsultationPage';
import PharmacyPage      from './PharmacyPage';
import AppointmentsPage from './AppointmentsPage';
import AnalyticsPage      from './AnalyticsPage';
import PatientPortalPage  from './PatientPortalPage';
import NotificationsPage  from './NotificationsPage';
import StaffManagementPage from './StaffManagementPage';
import SettingsPage         from './settings/SettingsPage';
import BillingPage          from './BillingPage';
import Badge    from '../components/Badge';
import * as Icons from '../components/Icons';
import LabPage         from './LabPage';
import FormularyPage   from './FormularyPage';
import InpatientPage   from './InpatientPage';
import ReferralsPage   from './ReferralsPage';
import { api }         from '../lib/api';

/* ── resolve icon by string name ── */
const icon = (name, props = {}) => {
  const Ic = Icons[name];
  return Ic ? <Ic width={15} height={15} {...props} /> : null;
};

/* ════════════════════════════════════════════════════════════
   GLOBAL PATIENT SEARCH
════════════════════════════════════════════════════════════ */
function GlobalSearch() {
  const { navigate } = useAppCtx();
  const { user }     = useAuth();
  const [q,          setQ]          = useState('');
  const [results,    setResults]    = useState([]);
  const [open,       setOpen]       = useState(false);
  const [searching,  setSearching]  = useState(false);
  const debRef = useRef(null);
  const wrapRef = useRef(null);

  /* Hide on outside click */
  useEffect(() => {
    const close = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(`/api/v1/patients?q=${encodeURIComponent(q)}&limit=7`);
        setResults(r.patients ?? []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 280);
  }, [q]);

  const go = page => { setQ(''); setResults([]); setOpen(false); navigate(page); };

  /* Only doctors, nurses, admins can do global search */
  if (!['nurse','doctor','admin'].includes(user.role)) return null;

  return (
    <div ref={wrapRef} style={{ position:'relative', flex:'1 1 220px', maxWidth:340 }}>
      <div style={{ position:'relative' }}>
        <Icons.IcSearch width={14} height={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }} />
        <input
          className="input"
          style={{ paddingLeft:32, paddingRight:searching ? 32 : 10, height:34, fontSize:'.82rem' }}
          placeholder="Search patients…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {searching && (
          <div style={{ position:'absolute', right:10, top:'50%', marginTop:-7, width:14, height:14, border:'2px solid var(--primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="search-dropdown" style={{ top:'calc(100% + 6px)' }}>
          {results.map(p => (
            <button key={p.id} className="search-dropdown-item" onClick={() => go('register')}>
              <Icons.IcPerson width={13} height={13} style={{ color:'var(--text-400)', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text-900)' }}>{p.name}</div>
                <div style={{ fontSize:'.72rem', color:'var(--text-400)' }}>{p.id} · {p.phone}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && q.length >= 2 && results.length === 0 && !searching && (
        <div className="search-dropdown" style={{ top:'calc(100% + 6px)', padding:'10px 14px', fontSize:'.82rem', color:'var(--text-400)' }}>
          No patients found
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TOPBAR
════════════════════════════════════════════════════════════ */
function Topbar() {
  const { user, logout }              = useAuth();
  const { page, navigate, toggleSidebar } = useAppCtx();
  const { restartTour }               = useTour();
  const { settings }                  = useSettings();
  const toast                         = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cfg = ROLE_CONFIG[user.role];
  const avatar = settings?.profile?.avatar || '';

  /* close user menu on outside click */
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);

  const unread = NAV_CONFIG[user.role]
    ?.flatMap(s => s.items)
    .find(i => i.key === 'notifications')?.badge?.count ?? 0;

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="icon-btn hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Icons.IcMenu width={16} height={16} />
      </button>

      {/* Brand */}
      <div className="brand" onClick={() => navigate('dashboard')} role="link" tabIndex={0}>
        <div className="brand-logo">
          <Icons.IcHospital width={18} height={18} />
        </div>
        <span className="brand-name">
          MediBank <span>Nexus</span>
        </span>
      </div>

      {/* Global patient search — desktop */}
      <GlobalSearch />

      {/* Right controls */}
      <div className="topbar-right">
        {/* Tour badge — only shown on pages that have a tour defined */}
        {TOUR_DEFS[page] && (
          <button
            className="tour-badge"
            onClick={() => restartTour(page)}
            title="Replay the guided tour for this page"
            aria-label="Replay page tour"
          >
            ? Tour
          </button>
        )}
        {/* Notifications bell */}
        <button
          data-tour="topbar-notifications"
          className="icon-btn"
          onClick={() => navigate('notifications')}
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        >
          <Icons.IcBell width={16} height={16} />
          {unread > 0 && <span className="badge-dot" />}
        </button>

        {/* User chip */}
        <div
          data-tour="topbar-user"
          className="user-chip"
          onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={userMenuOpen}
          style={{ position: 'relative' }}
        >
          <Avatar initials={user.initials} color={cfg.color} size={26} src={avatar || undefined} />
          <div className="user-chip-info">
            <div className="user-chip-name">{user.name.split(' ')[0]}</div>
            <div className="user-chip-role">{cfg.label}</div>
          </div>
          <Icons.IcChevronDown
            width={12} height={12}
            style={{ color: 'var(--text-400)', transition: 'transform .2s', transform: userMenuOpen ? 'rotate(180deg)' : '' }}
          />

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="dropdown-menu" style={{ minWidth: 200 }}>
              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '.84rem' }}>{user.name}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 2 }}>{user.email}</div>
              </div>
              <div style={{ padding: '4px' }}>
                {[
                  ['notifications', 'IcBell',   'Notifications'],
                  ['settings',      'IcGear',   'Settings'],
                ].map(([key, ic, lbl]) => (
                  <button
                    key={key}
                    className="dropdown-item"
                    onClick={() => { navigate(key); setUserMenuOpen(false); }}
                  >
                    {icon(ic)} {lbl}
                  </button>
                ))}
                <div className="dropdown-separator" />
                <button
                  className="dropdown-item"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => {
                    logout();
                    toast.info('Signed out successfully');
                  }}
                >
                  <Icons.IcLogout width={14} height={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════════════════ */
function Sidebar() {
  const { user, logout }            = useAuth();
  const { page, navigate, sidebarOpen, closeSidebar, sidebarCollapsed, toggleSidebarCollapse } = useAppCtx();
  const { hospital }                = useTenant();
  const { settings }                = useSettings();
  const toast                       = useToast();
  const cfg    = ROLE_CONFIG[user.role];
  const avatar = settings?.profile?.avatar || '';
  const hospitalLogo = settings?.hospital?.logo || '';
  const navSections = NAV_CONFIG[user.role] ?? [];
  const C = sidebarCollapsed; // shorthand

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' mobile-open' : ''}${C ? ' collapsed' : ''}`}>

        {/* Hospital / Tenant badge */}
        {hospital && (
          <div data-tour="hospital-chip" className={`sidebar-hospital-chip${C ? ' collapsed' : ''}`}>
            <div
              className="sidebar-hospital-icon"
              style={{
                background: hospitalLogo ? 'transparent' : `${hospital.primaryColor}18`,
                border: `1px solid ${hospital.primaryColor}33`,
                color: hospital.primaryColor,
                overflow: 'hidden',
              }}
              title={C ? hospital.name : undefined}
            >
              {hospitalLogo
                ? <img src={hospitalLogo} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                : hospital.shortName?.slice(0, 2)
              }
            </div>
            {!C && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '.78rem', color: 'var(--text-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hospital.name}
                </div>
                <div style={{ fontSize: '.65rem', color: 'var(--text-400)', marginTop: 1 }}>
                  {hospital.city} · {hospital.tier?.charAt(0).toUpperCase() + hospital.tier?.slice(1)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role badge */}
        <div className={`sidebar-role-badge${C ? ' collapsed' : ''}`} style={{ background: cfg.bg }} title={C ? `${user.name} — ${cfg.label}` : undefined}>
          <Avatar initials={user.initials} color={cfg.color} size={C ? 30 : 32} src={avatar || undefined} />
          {!C && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-500)', marginTop: 1 }}>
                {cfg.label} · {user.dept}
              </div>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <nav data-tour="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {navSections.map(section => (
            <div key={section.section}>
              {!C && <div className="sidebar-section">{section.section}</div>}
              {C && <div className="sidebar-section-divider" />}
              {section.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item${page === item.key ? ' active' : ''}${C ? ' icon-only' : ''}`}
                  onClick={() => navigate(item.key)}
                  aria-current={page === item.key ? 'page' : undefined}
                  title={C ? item.label : undefined}
                >
                  {icon(item.icon)}
                  {!C && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!C && item.badge && (
                    <span
                      className="nav-item-badge"
                      style={{ background: item.badge.variant === 'danger' ? 'var(--danger)' : 'var(--primary)' }}
                    >
                      {item.badge.count}
                    </span>
                  )}
                  {C && item.badge && (
                    <span className="nav-item-badge-dot" style={{ background: item.badge.variant === 'danger' ? 'var(--danger)' : 'var(--primary)' }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom controls: collapse toggle + sign out */}
        <div style={{ padding: '6px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Collapse toggle */}
          <button
            className={`nav-item${C ? ' icon-only' : ''}`}
            style={{ width: '100%', color: 'var(--text-400)' }}
            onClick={toggleSidebarCollapse}
            title={C ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={C ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {C
              ? <Icons.IcChevronRight width={15} height={15} />
              : <Icons.IcChevronLeft  width={15} height={15} />}
            {!C && <span style={{ flex: 1 }}>Collapse</span>}
          </button>

          {/* Sign out */}
          <button
            className={`nav-item${C ? ' icon-only' : ''}`}
            style={{ width: '100%', color: 'var(--danger)' }}
            onClick={() => { logout(); toast.info('Signed out successfully'); }}
            title={C ? 'Sign out' : undefined}
          >
            <Icons.IcLogout width={15} height={15} />
            {!C && 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   WELCOME DASHBOARD  (shown on page = 'dashboard')
════════════════════════════════════════════════════════════ */
const ROLE_STATS = {
  nurse: [
    { icon: <Icons.IcPersonAdd />, label: 'Patients Today',  value: '12',    change: '+3',    trend: 'up',   color: 'var(--teal)',    delay: 0   },
    { icon: <Icons.IcCalendar  />, label: 'Appointments',    value: '28',    change: '+5',    trend: 'up',   color: 'var(--primary)', delay: 60  },
    { icon: <Icons.IcBell      />, label: 'Pending Check-ins',value: '4',    change: '-2',    trend: 'up',   color: 'var(--warning)', delay: 120 },
    { icon: <Icons.IcCheckCircle/>,label: 'Completed Today', value: '8',     change: '+8',    trend: 'up',   color: 'var(--success)', delay: 180 },
  ],
  doctor: [
    { icon: <Icons.IcStethoscope/>,label: 'Consultations',   value: '7',     change: '+2',    trend: 'up',   color: 'var(--primary)', delay: 0   },
    { icon: <Icons.IcPill      />, label: 'Rx Issued',       value: '14',    change: '+4',    trend: 'up',   color: 'var(--teal)',    delay: 60  },
    { icon: <Icons.IcCalendar  />, label: 'Upcoming',        value: '5',     change: null,    trend: null,   color: 'var(--warning)', delay: 120 },
    { icon: <Icons.IcCheckCircle/>,label: 'Completed',       value: '7',     change: '+7',    trend: 'up',   color: 'var(--success)', delay: 180 },
  ],
  pharmacist: [
    { icon: <Icons.IcPill      />, label: 'Pending Rx',      value: '3',     change: null,    trend: null,   color: 'var(--danger)',  delay: 0   },
    { icon: <Icons.IcCheckCircle/>,label: 'Dispensed Today', value: '22',    change: '+6',    trend: 'up',   color: 'var(--success)', delay: 60  },
    { icon: <Icons.IcBox       />, label: 'Low Stock Items',  value: '2',     change: '+1',    trend: 'down', color: 'var(--warning)', delay: 120 },
    { icon: <Icons.IcBarChart  />, label: 'Total Drugs',     value: '8',     change: null,    trend: null,   color: 'var(--primary)', delay: 180 },
  ],
  admin: [
    { icon: <Icons.IcPeople    />, label: 'Total Patients',  value: '5,486', change: '+24.3%',trend: 'up',   color: 'var(--primary)', delay: 0   },
    { icon: <Icons.IcBarChart  />, label: 'Monthly Revenue', value: '₦6.01M',change: '+12.8%',trend: 'up',   color: 'var(--success)', delay: 60  },
    { icon: <Icons.IcCalendar  />, label: 'Appointments',    value: '641',   change: '+18.1%',trend: 'up',   color: 'var(--teal)',    delay: 120 },
    { icon: <Icons.IcPill      />, label: 'Rx Issued',       value: '4,108', change: '+9.7%', trend: 'up',   color: 'var(--warning)', delay: 180 },
  ],
  patient: [
    { icon: <Icons.IcCalendar  />, label: 'Next Appointment',value: '25 Mar',change: null,    trend: null,   color: 'var(--primary)', delay: 0   },
    { icon: <Icons.IcPill      />, label: 'Active Rx',       value: '1',     change: null,    trend: null,   color: 'var(--teal)',    delay: 60  },
    { icon: <Icons.IcHistory   />, label: 'Past Visits',     value: '3',     change: null,    trend: null,   color: 'var(--warning)', delay: 120 },
    { icon: <Icons.IcBell      />, label: 'Notifications',   value: '3',     change: null,    trend: null,   color: 'var(--danger)',  delay: 180 },
  ],
};

const QUICK_ACTIONS = {
  nurse:      [['register','Register Patient','IcPersonAdd','primary'],['appointments','Book Appointment','IcCalendar','teal']],
  doctor:     [['consultation','New Consultation','IcStethoscope','primary'],['appointments','View Schedule','IcCalendar','teal']],
  pharmacist: [['pharmacy','Open Rx Queue','IcPill','primary']],
  admin:      [['analytics','View Analytics','IcBarChart','primary']],
  patient:    [['appointments','Book Appointment','IcCalendar','primary'],['portal','My Records','IcFileMedical','teal']],
};

const AI_GREETINGS = {
  nurse:      "Hello! I'm Nexus AI. I can help you look up patient allergies, guide you through registration, or explain vitals ranges. What do you need?",
  doctor:     "Good morning, Doctor. I can help draft clinical summaries, suggest ICD-10 codes, flag drug interactions, or answer clinical questions. How can I assist?",
  pharmacist: "Hi! I can help check drug interactions, look up dosage information, or assist with stock queries. What would you like to know?",
  admin:      "Welcome, Administrator. I can help interpret analytics data, explain platform features, or assist with user management queries. What do you need?",
  patient:    "Hello! I'm Nexus AI. I can help you understand your prescriptions, explain your diagnosis, or answer general health questions. How can I help you today?",
};

const AI_MODEL_LABELS = {
  claude: 'Claude',
  gpt4:   'GPT-4o',
  gemini: 'Gemini',
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function AiChat({ role }) {
  const { settings } = useSettings();
  const preferredModel = settings?.clinical?.preferredAiModel ?? 'claude';

  const [messages, setMessages] = useState([{ from: 'ai', text: AI_GREETINGS[role] }]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(p => [...p, { from: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/v1/ai/message`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages:  [{ role: 'user', content: userMsg }],
          model:     preferredModel,
          maxTokens: 400,
        }),
      });

      if (!res.ok) {
        /* Fall back to a helpful error rather than crashing */
        const err = await res.json().catch(() => ({}));
        setMessages(p => [...p, { from: 'ai', text: err.error ?? 'Service temporarily unavailable. Please try again.' }]);
      } else {
        const data  = await res.json();
        const reply = data.content?.[0]?.text ?? data.choices?.[0]?.message?.content ?? "I'm here to help! Could you rephrase that?";
        setMessages(p => [...p, { from: 'ai', text: reply }]);
      }
    } catch {
      setMessages(p => [...p, { from: 'ai', text: 'Connection issue. Please check your network and try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">
          <Icons.IcCPU width={17} height={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="ai-name">Nexus AI</div>
          <div className="ai-status">
            <span className="ai-dot" />
            Online · Medical Assistant
          </div>
        </div>
        <span style={{ fontSize: '.7rem', color: 'var(--text-400)', padding: '3px 9px', background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', flexShrink: 0 }}>
          {AI_MODEL_LABELS[preferredModel] ?? 'Claude'}
        </span>
      </div>

      {/* Messages */}
      <div className="ai-messages" id="ai-msg-scroll">
        {messages.map((m, i) => (
          <div key={i} className={`ai-message ${m.from}`}>
            {m.from === 'ai'
              ? <div className="msg-avatar" style={{ background: 'linear-gradient(135deg,var(--primary),var(--teal))', width: 28, height: 28, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                  <Icons.IcCPU width={14} height={14} style={{ color: 'white' }} />
                </div>
              : <div className="msg-avatar" style={{ background: 'var(--primary-light)', width: 28, height: 28, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                  <Icons.IcPerson width={14} height={14} style={{ color: 'var(--primary)' }} />
                </div>
            }
            <div className="msg-bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai">
            <div className="msg-avatar" style={{ background: 'linear-gradient(135deg,var(--primary),var(--teal))', width: 28, height: 28, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
              <Icons.IcCPU width={14} height={14} style={{ color: 'white' }} />
            </div>
            <div className="msg-bubble">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder={`Ask Nexus AI anything as a ${role}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button
          className="btn btn-primary btn-icon"
          onClick={send}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <Icons.IcSend width={14} height={14} />
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user }    = useAuth();
  const { navigate } = useAppCtx();
  const cfg          = ROLE_CONFIG[user.role];
  const stats        = ROLE_STATS[user.role] ?? [];
  const actions      = QUICK_ACTIONS[user.role] ?? [];
  const today        = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="anim-fade-in">
      {/* Welcome hero */}
      <div data-tour="welcome-card" className="welcome-card">
        <div>
          <div className="welcome-title">
            Welcome back, {user.name.split(' ').find(n => !n.startsWith('Dr')) ?? user.name.split(' ')[0]} 👋
          </div>
          <div className="welcome-sub">{today} · {user.dept}</div>
          <div className="role-pill" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)' }}>
            {icon(
              { nurse:'IcNurse', doctor:'IcStethoscope', pharmacist:'IcPill', admin:'IcGear', patient:'IcPerson' }[user.role]
            )}
            {cfg.label}
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div data-tour="kpi-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 13, marginBottom: 22 }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Quick actions */}
      {actions.length > 0 && (
        <>
          <div className="section-divider">Quick Actions</div>
          <div data-tour="quick-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            {actions.map(([key, label, ic, variant]) => (
              <button
                key={key}
                className={`btn btn-${variant}`}
                onClick={() => navigate(key)}
              >
                {icon(ic)} {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Nexus AI */}
      <div className="section-divider">Nexus AI Assistant</div>
      <div data-tour="ai-chat">
        <AiChat role={user.role} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE PLACEHOLDER  (for pages not yet built)
════════════════════════════════════════════════════════════ */
function PagePlaceholder({ pageKey }) {
  const { navigate } = useAppCtx();
  const title = PAGE_TITLES[pageKey] ?? pageKey;

  const COMING = {
    register:      { icon: <Icons.IcPersonAdd  width={26} height={26} />, step: '7'  },
    consultation:  { icon: <Icons.IcStethoscope width={26} height={26} />, step: '8'  },
    pharmacy:      { icon: <Icons.IcPill        width={26} height={26} />, step: '9'  },
    appointments:  { icon: <Icons.IcCalendar    width={26} height={26} />, step: '10' },
    analytics:     { icon: <Icons.IcBarChart    width={26} height={26} />, step: '11' },
    portal:        { icon: <Icons.IcFileMedical  width={26} height={26} />, step: '12' },
    notifications: { icon: <Icons.IcBell        width={26} height={26} />, step: '13' },
    settings:      { icon: <Icons.IcGear        width={26} height={26} />, step: '—'  },
  };
  const meta = COMING[pageKey] ?? { icon: <Icons.IcGrid width={26} height={26} />, step: '—' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', color: 'var(--primary)',
        }}>
          {meta.icon}
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-.02em', marginBottom: 8 }}>
          {title}
        </h2>
        <p style={{ fontSize: '.85rem', color: 'var(--text-500)', lineHeight: 1.65, marginBottom: 20 }}>
          This module is coming in <strong>Step {meta.step}</strong> of the build.
          The full working implementation will be built next.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('dashboard')}>
            <Icons.IcHome width={14} height={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE ROUTER
════════════════════════════════════════════════════════════ */
function PageRouter() {
  const { page } = useAppCtx();

  switch (page) {
    case 'dashboard': return <Dashboard />;
    case 'register':      return <RegisterPage />;
    case 'consultation':  return <ConsultationPage />;
    case 'pharmacy':      return <PharmacyPage />;
    case 'appointments':  return <AppointmentsPage />;
    case 'analytics':     return <AnalyticsPage />;
    case 'portal':         return <PatientPortalPage />;
    case 'notifications':    return <NotificationsPage />;
    case 'staff-management': return <StaffManagementPage />;
    case 'settings':         return <SettingsPage />;
    case 'billing':          return <BillingPage />;
    case 'lab':              return <LabPage />;
    case 'formulary':        return <FormularyPage />;
    case 'inpatient':        return <InpatientPage />;
    case 'referrals':        return <ReferralsPage />;
    default:                 return <PagePlaceholder pageKey={page} />;
  }
}

/* ════════════════════════════════════════════════════════════
   TRIAL BANNER — shown for free_trial hospitals
════════════════════════════════════════════════════════════ */
function TrialBanner() {
  const { hospital } = useTenant();
  const { navigate } = useAppCtx();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!hospital || !['free_trial', 'trial'].includes(hospital.tier ?? hospital.status)) return null;

  const trialStart = hospital.trialStartDate ? new Date(hospital.trialStartDate) : new Date(hospital.createdAt);
  const daysUsed   = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft   = Math.max(0, 30 - daysUsed);
  const expired    = daysLeft === 0;

  const variant = expired ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--primary)';
  const bg      = expired ? 'var(--danger-light)' : daysLeft <= 7 ? 'var(--warning-light)' : 'var(--primary-light)';

  return (
    <div style={{
      background: bg, borderBottom: `1px solid ${variant}`,
      padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
      fontSize: '.81rem', color: variant, flexShrink: 0, flexWrap: 'wrap',
    }}>
      <Icons.IcWarning width={14} height={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        {expired
          ? <><strong>Your free trial has expired.</strong> Upgrade to Pro to continue using all features.</>
          : <><strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</strong> on your free trial · 5 staff max · Limited features</>
        }
      </span>
      <button
        className="btn btn-sm"
        style={{ background: variant, color: 'white', border: 'none', flexShrink: 0 }}
        onClick={() => navigate('settings')}
      >
        Upgrade to Pro
      </button>
      {!expired && (
        <button
          className="icon-btn"
          style={{ color: variant, flexShrink: 0 }}
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <Icons.IcX width={14} height={14} />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   APP SHELL  (exported)
════════════════════════════════════════════════════════════ */
export default function AppShell() {
  return (
    <div className="app-shell">
      <Topbar />
      <TrialBanner />
      <div className="app-body">
        <Sidebar />
        <main className="main-area">
          <PageRouter />
        </main>
      </div>
    </div>
  );
}
