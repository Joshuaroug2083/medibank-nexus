/**
 * Step 11 — Admin Analytics Dashboard
 * KPI cards · Area chart · Bar chart · Dept breakdown · Staff table · Audit log
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard   from '../components/StatCard';
import Card       from '../components/Card';
import Badge      from '../components/Badge';
import {
  IcPeople, IcCalendar, IcPill, IcBarChart,
  IcArrowUp, IcArrowDown, IcNaira, IcWarning,
  IcJournal, IcPerson, IcShield, IcStethoscope,
  IcStar, IcStarFill, IcDownload,
} from '../components/Icons';

/* ── CSV export helper ── */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
function downloadExport(endpoint, filename) {
  const token = localStorage.getItem('nexus_token') ?? '';
  fetch(`${API_BASE}/api/v1/export/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => alert('Export failed. Please try again.'));
}

/* ── mock data ───────────────────────────────────────────── */
const MONTHLY_DATA = [
  { month: 'Oct', patients: 312, appointments: 480, revenue: 4_200_000 },
  { month: 'Nov', patients: 341, appointments: 510, revenue: 4_580_000 },
  { month: 'Dec', patients: 298, appointments: 440, revenue: 3_990_000 },
  { month: 'Jan', patients: 365, appointments: 556, revenue: 4_850_000 },
  { month: 'Feb', patients: 398, appointments: 590, revenue: 5_210_000 },
  { month: 'Mar', patients: 421, appointments: 641, revenue: 6_010_000 },
];

const DEPT_DATA = [
  { dept: 'General Med', visits: 1820, pct: 33 },
  { dept: 'Paediatrics', visits: 984,  pct: 18 },
  { dept: 'OBS & Gynae', visits: 756,  pct: 14 },
  { dept: 'Surgery',     visits: 642,  pct: 12 },
  { dept: 'Dentistry',   visits: 531,  pct: 10 },
  { dept: 'Ophthalmology',visits: 420, pct: 8  },
  { dept: 'Other',       visits: 253,  pct: 5  },
];

const TOP_DX = [
  { dx: 'Malaria',           count: 634, pct: 78 },
  { dx: 'Hypertension',      count: 512, pct: 63 },
  { dx: 'Diabetes (Type 2)', count: 387, pct: 48 },
  { dx: 'RTI / URTI',        count: 341, pct: 42 },
  { dx: 'Typhoid Fever',     count: 298, pct: 37 },
  { dx: 'Anaemia',           count: 213, pct: 26 },
];

const STAFF = [
  { id: 1, name: 'Dr. Emeka Nwosu',   role: 'Doctor',     dept: 'General Medicine',  patients: 312, satisfaction: 4.9, status: 'active'  },
  { id: 2, name: 'Dr. Adaeze Ibe',    role: 'Doctor',     dept: 'OBS & Gynaecology', patients: 287, satisfaction: 4.8, status: 'active'  },
  { id: 3, name: 'Dr. Fatima Bello',  role: 'Doctor',     dept: 'Paediatrics',       patients: 264, satisfaction: 4.9, status: 'active'  },
  { id: 4, name: 'Ngozi Okafor',      role: 'Nurse',      dept: 'General Medicine',  patients: 198, satisfaction: 4.7, status: 'active'  },
  { id: 5, name: 'Bisi Adeleke',      role: 'Pharmacist', dept: 'Pharmacy',          patients: 156, satisfaction: 4.6, status: 'active'  },
  { id: 6, name: 'Dr. Segun Adeleke', role: 'Doctor',     dept: 'Surgery',           patients: 143, satisfaction: 4.6, status: 'on-leave'},
];

const AUDIT_LOG = [
  { id: 'AUD-001', ts: '2026-03-22 10:47', user: 'admin@medibank.ng',   action: 'Created user account',         entity: 'dr.fatima@medibank.ng',  level: 'info'    },
  { id: 'AUD-002', ts: '2026-03-22 09:31', user: 'doctor@medibank.ng',  action: 'Signed consultation note',      entity: 'PT-2026-0012',            level: 'info'    },
  { id: 'AUD-003', ts: '2026-03-22 09:14', user: 'pharma@medibank.ng',  action: 'Dispensed prescription',        entity: 'RX-2026-0041',            level: 'success' },
  { id: 'AUD-004', ts: '2026-03-22 08:52', user: 'nurse@medibank.ng',   action: 'Registered new patient',        entity: 'PT-2026-0089',            level: 'success' },
  { id: 'AUD-005', ts: '2026-03-21 17:04', user: 'admin@medibank.ng',   action: 'Modified drug inventory',       entity: 'Azithromycin 250mg',      level: 'warning' },
  { id: 'AUD-006', ts: '2026-03-21 15:38', user: 'doctor@medibank.ng',  action: 'Exported patient records',      entity: 'PT-2026-0031',            level: 'warning' },
  { id: 'AUD-007', ts: '2026-03-21 11:22', user: 'admin@medibank.ng',   action: 'Failed login attempt (3rd)',    entity: '196.51.xx.xx',             level: 'danger'  },
  { id: 'AUD-008', ts: '2026-03-21 08:01', user: 'pharma@medibank.ng',  action: 'Dispensed prescription',        entity: 'RX-2026-0038',            level: 'success' },
];

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (n) => n >= 1_000_000
  ? `₦${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `₦${(n / 1_000).toFixed(0)}K` : `₦${n}`;

const auditLevelColor = {
  info:    'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
};

/* ── animated count-up hook ──────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

/* ── Star rating ─────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        i <= Math.floor(rating)
          ? <IcStarFill key={i} width={12} height={12} style={{ color: '#f59e0b' }} />
          : <IcStar     key={i} width={12} height={12} style={{ color: 'var(--border-dark)' }} />
      ))}
      <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-700)', marginLeft: 3 }}>
        {rating}
      </span>
    </div>
  );
}

/* ── Custom tooltip for recharts ─────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)', fontSize: '.8rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-900)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-500)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-900)' }}>
            {p.name === 'Revenue' ? fmt(p.value) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card with count-up ──────────────────────────────── */
function KpiCard({ icon, label, target, prefix = '', suffix = '', color, change, trend, delay = 0 }) {
  const count = useCountUp(target, 1400);
  const display = `${prefix}${count.toLocaleString()}${suffix}`;

  return (
    <div
      className="stat-card anim-fade-up"
      style={{ '--stat-accent': color, animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div className="stat-icon" style={{ background: `color-mix(in srgb, ${color} 12%, white)` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {change && (
          <div className={`stat-change ${trend}`}>
            {trend === 'up'
              ? <IcArrowUp  width={12} height={12} />
              : <IcArrowDown width={12} height={12} />
            }
            {change}
          </div>
        )}
      </div>
      <div className="stat-value" style={{ color }}>{display}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────── */
export default function AnalyticsPage() {
  const [period,     setPeriod]    = useState('6m');
  const [activeTab,  setActiveTab] = useState('overview');
  const [auditFilter,setAuditFilter] = useState('all');

  /* Real KPI data from API */
  const [kpis,          setKpis]         = useState(null);
  const [monthlyData,   setMonthlyData]  = useState(MONTHLY_DATA);
  const [staffData,     setStaffData]    = useState(STAFF);
  const [auditData,     setAuditData]    = useState(AUDIT_LOG);
  const [apiLoading,    setApiLoading]   = useState(false);

  useEffect(() => {
    setApiLoading(true);
    Promise.all([
      api.get('/api/v1/analytics/summary').catch(() => null),
      api.get('/api/v1/analytics/audit-log').catch(() => null),
    ]).then(([summary, audit]) => {
      if (summary?.kpis) {
        setKpis(summary.kpis);
      }
      const srcMonthly = summary?.charts?.monthlyPatients ?? summary?.monthlyPatients;
      if (srcMonthly?.length) {
        setMonthlyData(srcMonthly.map((m, i) => ({
          month:        m.month,
          patients:     parseInt(m.count),
          appointments: MONTHLY_DATA[i]?.appointments ?? 0,
          revenue:      MONTHLY_DATA[i]?.revenue       ?? 0,
        })));
      }
      if (audit?.logs?.length) {
        setAuditData(audit.logs.map(l => ({
          id:     l.id,
          ts:     l.created_at ? new Date(l.created_at).toLocaleString('en-GB') : '',
          user:   l.user_email ?? l.user_id ?? '—',
          action: l.action ?? '—',
          entity: l.entity ?? '—',
          level:  l.level ?? 'info',
        })));
      }
    }).finally(() => setApiLoading(false));
  }, []);

  const auditFiltered = auditFilter === 'all'
    ? auditData
    : auditData.filter(l => l.level === auditFilter);

  return (
    <div className="analytics-root anim-fade-up">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Analytics <span>Dashboard</span></div>
          <div className="page-subtitle">Hospital performance metrics · March 2026</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['1m', '3m', '6m', '1y'].map(p => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
          <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px' }} />
          <button className="btn btn-outline btn-sm" onClick={() => downloadExport('patients', 'patients.csv')} title="Export patients CSV">
            <IcDownload width={12} height={12} /> Patients
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadExport('invoices', 'invoices.csv')} title="Export invoices CSV">
            <IcDownload width={12} height={12} /> Invoices
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadExport('audit-log', 'audit-log.csv')} title="Export audit log CSV">
            <IcDownload width={12} height={12} /> Audit Log
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {[
          ['overview',  'Overview'],
          ['staff',     'Staff Performance'],
          ['audit',     'Audit Log'],
        ].map(([key, lbl]) => (
          <button
            key={key}
            className={`analytics-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* KPI row — uses real data when available, falls back to mock */}
          <div className="kpi-grid">
            <KpiCard icon={<IcPeople     width={20} height={20} />} label="Total Patients"  target={kpis?.totalPatients    ?? 5486} color="var(--primary)" change="+24.3%" trend="up"  delay={0}   />
            <KpiCard icon={<IcNaira      width={20} height={20} />} label="Monthly Revenue" target={6010000} prefix="₦" color="var(--success)" change="+12.8%" trend="up" delay={60}  />
            <KpiCard icon={<IcCalendar   width={20} height={20} />} label="Appointments"    target={kpis?.totalAppointments ?? 641} color="var(--teal)"    change="+18.1%" trend="up"  delay={120} />
            <KpiCard icon={<IcPill       width={20} height={20} />} label="Rx Dispensed"    target={kpis?.dispensedRx       ?? 4108} color="var(--warning)" change="+9.7%"  trend="up"  delay={180} />
            <KpiCard icon={<IcBarChart   width={20} height={20} />} label="Pending Rx"      target={kpis?.pendingRx         ?? 8}   color="var(--danger)"  change={null}  trend={null} delay={240} />
            <KpiCard icon={<IcPeople     width={20} height={20} />} label="Active Staff"    target={kpis?.activeStaff       ?? 47}  color="#7c3aed"        change={null}  trend={null} delay={300} />
          </div>

          {/* Charts row */}
          <div className="charts-row">
            {/* Area chart — volume trend */}
            <Card
              title="Patient Volume & Appointments"
              subtitle="6-month trend"
              style={{ flex: 2 }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0a6ebd" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0a6ebd" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-400)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-400)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="patients"     name="Patients"     stroke="#0a6ebd" fill="url(#gradPat)"  strokeWidth={2} dot={{ r: 4, fill: '#0a6ebd' }} />
                  <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#0d9488" fill="url(#gradAppt)" strokeWidth={2} dot={{ r: 4, fill: '#0d9488' }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Bar chart — revenue */}
            <Card title="Monthly Revenue" subtitle="₦ Naira" style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-400)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-400)' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bottom row — diagnoses + departments */}
          <div className="analytics-bottom">
            {/* Top diagnoses */}
            <Card title="Top Diagnoses" subtitle="This quarter">
              {TOP_DX.map((d, i) => (
                <div key={i} className="dx-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-700)' }}>{d.dx}</span>
                    <span style={{ fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-400)', fontWeight: 600 }}>{d.count}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${d.pct}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </Card>

            {/* Dept breakdown */}
            <Card title="Department Breakdown" subtitle="By visit volume">
              {DEPT_DATA.map((d, i) => {
                const colors = ['var(--primary)', 'var(--teal)', '#7c3aed', 'var(--warning)', 'var(--success)', '#ec4899', 'var(--text-400)'];
                return (
                  <div key={i} className="dept-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: colors[i], flexShrink: 0 }} />
                        <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-700)' }}>{d.dept}</span>
                      </div>
                      <span style={{ fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-400)', fontWeight: 600 }}>{d.pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${d.pct}%`, background: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </>
      )}

      {/* ── STAFF ── */}
      {activeTab === 'staff' && (
        <Card title="Staff Performance" subtitle="Sorted by patient count this month">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Patients</th>
                  <th>Satisfaction</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {STAFF.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-400)', fontSize: '.78rem' }}>
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--primary-light)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '.74rem', flexShrink: 0,
                        }}>
                          {s.name.split(' ').slice(-2).map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '.84rem' }}>{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={
                        s.role === 'Doctor' ? 'primary' :
                        s.role === 'Nurse'  ? 'teal'    : 'warning'
                      }>
                        {s.role}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--text-500)' }}>{s.dept}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        {s.patients}
                      </span>
                    </td>
                    <td><Stars rating={s.satisfaction} /></td>
                    <td>
                      <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                        {s.status === 'active' ? 'Active' : 'On Leave'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── AUDIT LOG ── */}
      {activeTab === 'audit' && (
        <Card
          title="Audit Log"
          subtitle="Immutable security and activity trail"
          action={
            <div style={{ display: 'flex', gap: 5 }}>
              {['all', 'info', 'success', 'warning', 'danger'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${auditFilter === f ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAuditFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          <div className="audit-list">
            {auditFiltered.map(log => (
              <div key={log.id} className="audit-row">
                <div
                  className="audit-level-dot"
                  style={{ background: auditLevelColor[log.level] }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>
                      {log.action}
                    </span>
                    <span style={{
                      fontSize: '.72rem', fontFamily: 'var(--font-mono)',
                      padding: '2px 7px', background: 'var(--surface-2)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
                      color: 'var(--text-400)',
                    }}>
                      {log.entity}
                    </span>
                  </div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 3 }}>
                    {log.user} · {log.ts} · {log.id}
                  </div>
                </div>
                <Badge
                  variant={
                    log.level === 'danger'  ? 'danger'  :
                    log.level === 'warning' ? 'warning' :
                    log.level === 'success' ? 'success' : 'primary'
                  }
                  style={{ flexShrink: 0 }}
                >
                  {log.level}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
