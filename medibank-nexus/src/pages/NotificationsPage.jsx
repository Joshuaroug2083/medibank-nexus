/**
 * Step 13 — Notification Centre
 * Inbox · Filter chips · Mark read/delete · Preferences tab
 */

import { useState, useMemo, useEffect } from 'react';
import { useToast }  from '../components/Toast';
import { api }       from '../lib/api';
import Badge         from '../components/Badge';
import Card          from '../components/Card';
import Toggle        from '../components/Toggle';
import EmptyState    from '../components/EmptyState';
import {
  IcBell, IcCalendar, IcPill, IcWarning, IcShield,
  IcCheckCircle, IcX, IcPerson, IcMail, IcPhone,
  IcSearch, IcFilter, IcTrash,
} from '../components/Icons';

/* ── Types config ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  appointment: { label: 'Appointment',  variant: 'primary',  icon: <IcCalendar   width={14} height={14} /> },
  prescription: { label: 'Prescription', variant: 'teal',    icon: <IcPill       width={14} height={14} /> },
  alert:        { label: 'Alert',        variant: 'danger',   icon: <IcWarning    width={14} height={14} /> },
  reminder:     { label: 'Reminder',     variant: 'warning',  icon: <IcBell       width={14} height={14} /> },
  system:       { label: 'System',       variant: 'neutral',  icon: <IcShield     width={14} height={14} /> },
};

const PRIORITY_COLOR = {
  high:   'var(--danger)',
  medium: 'var(--warning)',
  low:    'var(--border-dark)',
};

/* ── Mock notifications ──────────────────────────────────── */
const INITIAL_NOTIFS = [
  {
    id: 1, type: 'appointment', priority: 'high', read: false,
    title: 'Appointment Reminder',
    body: 'You have a follow-up appointment with Dr. Emeka Nwosu tomorrow, 25 April at 10:00 AM. Please arrive 10 minutes early.',
    time: '2 hours ago', ts: Date.now() - 7200000,
    action: 'View Appointment',
  },
  {
    id: 2, type: 'alert', priority: 'high', read: false,
    title: 'Allergy Conflict Detected',
    body: 'Prescription RX-2026-0048 for patient PT-2026-0019 contains Penicillin. Patient has a documented allergy. Immediate review required.',
    time: '3 hours ago', ts: Date.now() - 10800000,
    action: 'Review Prescription',
  },
  {
    id: 3, type: 'prescription', priority: 'medium', read: false,
    title: 'Prescription Ready for Pickup',
    body: 'Your prescription RX-2026-0041 (Lisinopril 10mg, Amlodipine 5mg) has been dispensed and is ready for collection at the pharmacy.',
    time: '5 hours ago', ts: Date.now() - 18000000,
    action: 'View Prescription',
  },
  {
    id: 4, type: 'reminder', priority: 'medium', read: false,
    title: 'Low Stock Alert',
    body: 'Azithromycin 250mg stock is critically low (8 units remaining, reorder threshold: 30). Please contact the supplier immediately.',
    time: 'Yesterday', ts: Date.now() - 86400000,
    action: 'View Inventory',
  },
  {
    id: 5, type: 'appointment', priority: 'low', read: true,
    title: 'Appointment Confirmed',
    body: 'Appointment APT-2026-0087 for Chidi Obi on 25 April at 10:00 AM with Dr. Emeka Nwosu has been confirmed. A reminder will be sent 24 hours before.',
    time: 'Yesterday', ts: Date.now() - 90000000,
    action: null,
  },
  {
    id: 6, type: 'system', priority: 'low', read: true,
    title: 'System Backup Completed',
    body: 'Nightly database backup completed successfully at 02:00 AM. All patient records are secure. Next backup scheduled for tomorrow.',
    time: '2 days ago', ts: Date.now() - 172800000,
    action: null,
  },
  {
    id: 7, type: 'alert', priority: 'high', read: true,
    title: 'Failed Login Attempt',
    body: '3 consecutive failed login attempts detected from IP 196.51.xx.xx. The account has been temporarily locked for security.',
    time: '2 days ago', ts: Date.now() - 180000000,
    action: 'Review Security Log',
  },
  {
    id: 8, type: 'prescription', priority: 'low', read: true,
    title: 'Prescription Refill Due',
    body: 'Patient Taiwo Adeyemi\'s Metformin 500mg prescription is due for refill in 7 days. Schedule a review appointment if needed.',
    time: '3 days ago', ts: Date.now() - 259200000,
    action: 'Book Appointment',
  },
  {
    id: 9, type: 'reminder', priority: 'medium', read: true,
    title: 'Monthly Report Ready',
    body: 'The March 2026 hospital performance report has been generated. Total patients: 421, Revenue: ₦6.01M, Appointments: 641.',
    time: '3 days ago', ts: Date.now() - 270000000,
    action: 'View Report',
  },
  {
    id: 10, type: 'system', priority: 'low', read: true,
    title: 'Software Update Available',
    body: 'MediBank Nexus v2.1.0 is available with improved AI assistant, faster loading, and bug fixes. Update scheduled for next maintenance window.',
    time: '4 days ago', ts: Date.now() - 345600000,
    action: null,
  },
];

/* ── Preferences config ──────────────────────────────────── */
const PREF_TYPES = [
  { key: 'appointments', label: 'Appointment Reminders',     desc: 'Upcoming visit and booking confirmations' },
  { key: 'prescriptions',label: 'Prescription Notifications', desc: 'Dispensing status and refill alerts' },
  { key: 'alerts',       label: 'Clinical Alerts',           desc: 'Drug interactions, allergy conflicts' },
  { key: 'stock',        label: 'Stock & Inventory',         desc: 'Low stock thresholds and reorder alerts' },
  { key: 'system',       label: 'System Notifications',      desc: 'Backups, updates, security events' },
];

const PREF_CHANNELS = [
  { key: 'push',      label: 'In-App Notifications', desc: 'Shown in the notification centre' },
  { key: 'sms',       label: 'SMS Alerts',           desc: 'Sent to registered phone number' },
  { key: 'whatsapp',  label: 'WhatsApp Alerts',      desc: 'Via WhatsApp Business' },
  { key: 'email',     label: 'Email Digest',         desc: 'Daily summary to registered email' },
];

/* ── Notification item component ─────────────────────────── */
function NotifItem({ notif, onRead, onDelete }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;

  return (
    <div
      className={`notif-item${!notif.read ? ' unread' : ''}`}
      style={{ borderLeftColor: PRIORITY_COLOR[notif.priority] }}
    >
      {/* Unread dot */}
      {!notif.read && <div className="notif-unread-dot" />}

      {/* Icon */}
      <div
        className="notif-icon"
        style={{
          background: `color-mix(in srgb, ${PRIORITY_COLOR[notif.priority]} 10%, white)`,
          color: PRIORITY_COLOR[notif.priority],
        }}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span className={`notif-title${!notif.read ? ' bold' : ''}`}>{notif.title}</span>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {notif.priority === 'high' && (
              <Badge variant="danger">High Priority</Badge>
            )}
          </div>
          <span className="notif-time">{notif.time}</span>
        </div>

        <p className="notif-body">{notif.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {notif.action && (
            <button className="btn btn-outline btn-xs">
              {notif.action} →
            </button>
          )}
          {!notif.read && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => onRead(notif.id)}
            >
              <IcCheckCircle width={11} height={11} /> Mark read
            </button>
          )}
          <button
            className="btn btn-ghost btn-xs"
            style={{ color: 'var(--danger)', marginLeft: 'auto' }}
            onClick={() => onDelete(notif.id)}
          >
            <IcTrash width={11} height={11} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Normalise API notification → component shape ───────── */
function normaliseNotif(n) {
  return {
    id:       n.id,
    type:     n.type    ?? 'system',
    priority: n.priority ?? 'low',
    read:     n.read    ?? false,
    title:    n.title   ?? 'Notification',
    body:     n.body    ?? n.message ?? '',
    time:     n.created_at
      ? new Date(n.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '',
    ts:       n.created_at ? new Date(n.created_at).getTime() : 0,
    action:   n.action_label ?? null,
  };
}

/* ── main component ──────────────────────────────────────── */
export default function NotificationsPage() {
  const toast = useToast();

  const [notifs,   setNotifs]   = useState(INITIAL_NOTIFS);
  const [tab,      setTab]      = useState('inbox');         // inbox | preferences
  const [filter,   setFilter]   = useState('all');           // all | unread | appointment | prescription | alert | reminder | system
  const [search,   setSearch]   = useState('');
  const [prefs,    setPrefs]    = useState({
    types:    { appointments: true, prescriptions: true, alerts: true, stock: true, system: false },
    channels: { push: true, sms: true, whatsapp: false, email: true },
  });

  /* Load real notifications from API (falls back to mock if API fails) */
  useEffect(() => {
    api.get('/api/v1/notifications?limit=50')
      .then(({ notifications }) => {
        if (notifications?.length) {
          setNotifs(notifications.map(normaliseNotif));
        }
      })
      .catch(() => { /* keep mock data */ });
  }, []);

  /* counts */
  const unreadCount  = notifs.filter(n => !n.read).length;
  const highCount    = notifs.filter(n => !n.read && n.priority === 'high').length;
  const apptCount    = notifs.filter(n => !n.read && n.type === 'appointment').length;

  /* filtered list */
  const filtered = useMemo(() => {
    return notifs.filter(n => {
      if (filter === 'unread' && n.read)      return false;
      if (filter !== 'all' && filter !== 'unread' && n.type !== filter) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
                    !n.body.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [notifs, filter, search]);

  /* actions */
  const markRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.put(`/api/v1/notifications/${id}/read`).catch(() => {});
  };
  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    toast.success('Notification removed.');
  };
  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    api.put('/api/v1/notifications/read-all').catch(() => {});
    toast.success('All notifications marked as read.');
  };

  const togglePrefType    = (key) => setPrefs(p => ({ ...p, types:    { ...p.types,    [key]: !p.types[key]    } }));
  const togglePrefChannel = (key) => setPrefs(p => ({ ...p, channels: { ...p.channels, [key]: !p.channels[key] } }));

  return (
    <div className="notif-root anim-fade-up">

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">
            Notifications
            {unreadCount > 0 && (
              <span className="notif-page-count">{unreadCount}</span>
            )}
          </div>
          <div className="page-subtitle">Stay on top of appointments, alerts and clinical updates</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <IcCheckCircle width={13} height={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Stat row */}
      <div className="notif-stats">
        {[
          { label: 'Unread',        value: unreadCount, color: 'var(--primary)' },
          { label: 'High Priority', value: highCount,   color: 'var(--danger)'  },
          { label: 'Appointments',  value: apptCount,   color: 'var(--teal)'    },
          { label: 'Total',         value: notifs.length, color: 'var(--text-700)' },
        ].map(s => (
          <div key={s.label} className="notif-stat-card">
            <div className="notif-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="notif-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="notif-top-tabs">
        <button
          className={`notif-top-tab${tab === 'inbox' ? ' active' : ''}`}
          onClick={() => setTab('inbox')}
        >
          <IcBell width={14} height={14} /> Inbox
          {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
        </button>
        <button
          className={`notif-top-tab${tab === 'preferences' ? ' active' : ''}`}
          onClick={() => setTab('preferences')}
        >
          <IcFilter width={14} height={14} /> Preferences
        </button>
      </div>

      {/* ── INBOX ── */}
      {tab === 'inbox' && (
        <>
          {/* Search + filter chips */}
          <div className="notif-controls">
            <div className="input-wrap" style={{ flex: 1 }}>
              <div className="input-icon-left">
                <IcSearch width={14} height={14} />
              </div>
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search notifications…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="notif-filter-row">
            {[
              { key: 'all',          label: 'All',           count: notifs.length              },
              { key: 'unread',       label: 'Unread',        count: unreadCount                },
              { key: 'appointment',  label: 'Appointments',  count: notifs.filter(n => n.type === 'appointment').length  },
              { key: 'prescription', label: 'Prescriptions', count: notifs.filter(n => n.type === 'prescription').length },
              { key: 'alert',        label: 'Alerts',        count: notifs.filter(n => n.type === 'alert').length        },
              { key: 'reminder',     label: 'Reminders',     count: notifs.filter(n => n.type === 'reminder').length     },
              { key: 'system',       label: 'System',        count: notifs.filter(n => n.type === 'system').length       },
            ].map(f => (
              <button
                key={f.key}
                className={`notif-filter-chip${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="notif-chip-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="notif-list">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IcBell width={24} height={24} />}
                title="No notifications"
                description={search ? 'No results match your search.' : 'You\'re all caught up!'}
              />
            ) : (
              filtered.map(n => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={deleteNotif}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── PREFERENCES ── */}
      {tab === 'preferences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title="Notification Types" subtitle="Choose which events trigger notifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PREF_TYPES.map((pt, i) => (
                <div
                  key={pt.key}
                  style={{
                    padding: '13px 0',
                    borderBottom: i < PREF_TYPES.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Toggle
                    value={prefs.types[pt.key]}
                    onChange={() => togglePrefType(pt.key)}
                    label={pt.label}
                    description={pt.desc}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Delivery Channels" subtitle="How you receive notifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PREF_CHANNELS.map((ch, i) => (
                <div
                  key={ch.key}
                  style={{
                    padding: '13px 0',
                    borderBottom: i < PREF_CHANNELS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Toggle
                    value={prefs.channels[ch.key]}
                    onChange={() => togglePrefChannel(ch.key)}
                    label={ch.label}
                    description={ch.desc}
                  />
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => toast.success('Notification preferences saved.', 'Saved')}
            >
              <IcCheckCircle width={14} height={14} /> Save Preferences
            </button>
            <button className="btn btn-outline" onClick={() => toast.info('Preferences reset to defaults.')}>
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
