/**
 * Step 12 — Patient Portal
 * Profile header · Visit history timeline · Prescriptions · Appointments
 */

import { useState, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import { api }       from '../lib/api';
import { useAppCtx } from '../context/AppContext';
import Badge         from '../components/Badge';
import Alert         from '../components/Alert';
import Card          from '../components/Card';
import EmptyState    from '../components/EmptyState';
import {
  IcPerson, IcCalendar, IcPill, IcHistory,
  IcFileMedical, IcHeartPulse, IcCheckCircle,
  IcClock, IcWarning, IcStethoscope,
  IcMapPin, IcPhone, IcMail,
} from '../components/Icons';

/* ── Mock fallback data (used as initial state / offline fallback) ── */
const PATIENT = {
  id:         'PT-2026-0012',
  name:       'Chidi Obi',
  dob:        '1992-03-14',
  age:        34,
  gender:     'Male',
  phone:      '+234 801 234 5678',
  email:      'chidi.obi@gmail.com',
  address:    '14 Akin Adesola Street, Victoria Island',
  state:      'Lagos',
  bloodGroup: 'O+',
  genotype:   'AS',
  allergies:  ['Penicillin', 'Aspirin'],
  conditions: ['Hypertension'],
  medications:['Lisinopril 10mg daily', 'Amlodipine 5mg daily'],
  nin:        '12345678901',
  insurance:  'NHIS',
  insNumber:  'NHIS-2026-00342',
  ecName:     'Ngozi Obi',
  ecPhone:    '+234 802 345 6789',
  ecRelation: 'Spouse',
  registered: '2025-04-20',
};

const VISITS = [
  {
    id: 'VIS-2026-0041', date: '2026-03-22', time: '09:14',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    chief: 'Routine hypertension review and medication renewal',
    diagnosis: 'Hypertension — well controlled on Lisinopril 10mg + Amlodipine 5mg',
    plan: 'Continue current medications. Reduce salt intake. Follow-up in 1 month.',
    vitals: { bp: '128/82', pulse: 74, temp: '36.6', spo2: 98 },
    rx: ['Lisinopril 10mg — Once daily — 30 days', 'Amlodipine 5mg — Once daily — 30 days'],
    status: 'completed',
  },
  {
    id: 'VIS-2026-0009', date: '2026-01-15', time: '10:30',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    chief: 'Persistent headache and elevated blood pressure',
    diagnosis: 'Stage 1 Hypertension (newly diagnosed)',
    plan: 'Start Lisinopril 10mg. Lifestyle modification. Review in 6 weeks.',
    vitals: { bp: '158/96', pulse: 88, temp: '36.8', spo2: 97 },
    rx: ['Lisinopril 10mg — Once daily — 30 days'],
    status: 'completed',
  },
  {
    id: 'VIS-2025-0198', date: '2025-09-03', time: '08:45',
    doctor: 'Dr. Adaeze Ibe', dept: 'General Medicine',
    chief: 'Fever, chills, body aches for 4 days',
    diagnosis: 'Confirmed malaria (RDT positive)',
    plan: 'Artemether/Lumefantrine course. Rest. Fluids. Review if no improvement.',
    vitals: { bp: '116/74', pulse: 96, temp: '38.9', spo2: 96 },
    rx: ['Artemether/Lumefantrine — Twice daily — 3 days', 'Paracetamol 1000mg — Three times daily — 3 days'],
    status: 'completed',
  },
  {
    id: 'VIS-2025-0088', date: '2025-04-20', time: '11:00',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    chief: 'Registration and baseline health assessment',
    diagnosis: 'Healthy adult male. No active disease.',
    plan: 'Annual review recommended. Update vaccinations.',
    vitals: { bp: '122/78', pulse: 70, temp: '36.5', spo2: 99 },
    rx: ['Vitamin C 500mg — Once daily — 30 days'],
    status: 'completed',
  },
];

const PRESCRIPTIONS = [
  {
    id: 'RX-2026-0041', date: '2026-03-22', doctor: 'Dr. Emeka Nwosu',
    status: 'dispensed',
    drugs: [
      { name: 'Lisinopril 10mg',  dose: '10mg', freq: 'Once daily',      dur: '30 days', refills: 2 },
      { name: 'Amlodipine 5mg',   dose: '5mg',  freq: 'Once daily',      dur: '30 days', refills: 2 },
    ],
  },
  {
    id: 'RX-2026-0009', date: '2026-01-15', doctor: 'Dr. Emeka Nwosu',
    status: 'completed',
    drugs: [
      { name: 'Lisinopril 10mg',  dose: '10mg', freq: 'Once daily',      dur: '30 days', refills: 0 },
    ],
  },
  {
    id: 'RX-2025-0198', date: '2025-09-03', doctor: 'Dr. Adaeze Ibe',
    status: 'completed',
    drugs: [
      { name: 'Artemether/Lumefantrine', dose: '80/480mg', freq: 'Twice daily', dur: '3 days',  refills: 0 },
      { name: 'Paracetamol 1000mg',      dose: '1000mg',   freq: 'TDS',         dur: '3 days',  refills: 0 },
    ],
  },
];

const APPOINTMENTS = [
  {
    id: 'APT-2026-0087', date: '2026-04-25', time: '10:00',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    type: 'Follow-up Visit', status: 'upcoming',
    note: 'Monthly hypertension review',
  },
  {
    id: 'APT-2026-0041', date: '2026-03-22', time: '09:00',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    type: 'Follow-up Visit', status: 'completed',
    note: 'Hypertension management',
  },
  {
    id: 'APT-2026-0009', date: '2026-01-15', time: '10:30',
    doctor: 'Dr. Emeka Nwosu', dept: 'General Medicine',
    type: 'General Consultation', status: 'completed',
    note: 'Initial hypertension diagnosis',
  },
];

/* ── helpers ─────────────────────────────────────────────── */
const vitalColor = (key, val) => {
  const n = parseFloat(val);
  if (isNaN(n)) return 'var(--text-700)';
  if (key === 'pulse'  && (n < 60 || n > 100)) return 'var(--danger)';
  if (key === 'temp'   && n > 37.5)              return 'var(--danger)';
  if (key === 'spo2'   && n < 95)                return 'var(--danger)';
  return 'var(--text-700)';
};

/* ── normalisers ─────────────────────────────────────────── */
function normalisePatient(p) {
  return {
    id:         p.patient_id ?? p.id ?? PATIENT.id,
    name:       p.name       ?? PATIENT.name,
    dob:        p.dob        ?? PATIENT.dob,
    age:        p.age        ?? PATIENT.age,
    gender:     p.gender     ?? PATIENT.gender,
    phone:      p.phone      ?? PATIENT.phone,
    email:      p.email      ?? PATIENT.email,
    address:    p.address    ?? PATIENT.address,
    state:      p.state      ?? PATIENT.state,
    bloodGroup: p.blood_group ?? p.bloodGroup ?? PATIENT.bloodGroup,
    genotype:   p.genotype   ?? PATIENT.genotype,
    allergies:  Array.isArray(p.allergies)  ? p.allergies  : (p.allergies  ? [p.allergies]  : PATIENT.allergies),
    conditions: Array.isArray(p.conditions) ? p.conditions : (p.conditions ? [p.conditions] : PATIENT.conditions),
    medications:Array.isArray(p.medications)? p.medications: PATIENT.medications,
    insurance:  p.insurance_provider ?? p.insurance ?? PATIENT.insurance,
    insNumber:  p.insurance_number ?? p.insNumber ?? PATIENT.insNumber,
    nin:        p.nin        ?? PATIENT.nin,
    ecName:     p.ec_name    ?? p.ecName    ?? PATIENT.ecName,
    ecPhone:    p.ec_phone   ?? p.ecPhone   ?? PATIENT.ecPhone,
    ecRelation: p.ec_relation ?? p.ecRelation ?? PATIENT.ecRelation,
    registered: p.registered_at ? p.registered_at.slice(0,10) : (p.registered ?? PATIENT.registered),
  };
}

function normaliseVisit(v) {
  const rx = v.prescriptions ?? v.rx ?? [];
  return {
    id:        v.visit_id ?? v.id,
    date:      v.date ?? v.visit_date ?? new Date().toISOString().slice(0,10),
    time:      v.time ?? (v.created_at ? new Date(v.created_at).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) : ''),
    doctor:    v.doctor_name ?? v.doctor ?? '',
    dept:      v.dept ?? v.department ?? '',
    chief:     v.chief_complaint ?? v.chief ?? '',
    diagnosis: v.diagnosis ?? '',
    plan:      v.plan ?? '',
    vitals:    v.vitals ?? { bp: v.bp ?? '—', pulse: v.pulse ?? '—', temp: v.temp ?? '—', spo2: v.spo2 ?? '—' },
    rx:        Array.isArray(rx) ? rx.map(r => typeof r === 'string' ? r : `${r.drug_name ?? r.name} — ${r.frequency ?? r.freq} — ${r.duration ?? r.dur}`) : [],
    status:    v.status ?? 'completed',
  };
}

function normaliseRx(rx) {
  const drugs = rx.drugs ?? rx.items ?? rx.prescriptions ?? [];
  return {
    id:     rx.id ?? rx.prescription_id ?? '',
    date:   rx.date ?? rx.prescribed_at?.slice(0,10) ?? '',
    doctor: rx.doctor_name ?? rx.doctor ?? '',
    status: rx.status ?? 'dispensed',
    drugs:  Array.isArray(drugs) ? drugs.map(d => ({
      name:    d.drug_name ?? d.name ?? '',
      dose:    d.dose ?? d.dosage ?? '',
      freq:    d.frequency ?? d.freq ?? '',
      dur:     d.duration  ?? d.dur  ?? '',
      refills: d.refills   ?? 0,
    })) : [],
  };
}

function normaliseAppt(a) {
  return {
    id:     a.appointment_id ?? a.id ?? '',
    date:   a.date ?? a.appointment_date ?? '',
    time:   a.time ?? a.appointment_time ?? '',
    doctor: a.doctor_name ?? a.doctor ?? '',
    dept:   a.dept ?? a.department ?? '',
    type:   a.visit_type ?? a.type ?? 'Consultation',
    status: a.status ?? 'upcoming',
    note:   a.notes ?? a.note ?? '',
  };
}

/* ── sub-components ──────────────────────────────────────── */

function ProfileHeader({ patient }) {
  const age = patient.age;
  return (
    <div className="portal-profile-card">
      {/* Avatar / initials */}
      <div className="portal-avatar">
        {patient.name.split(' ').map(n => n[0]).join('')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-.02em' }}>
            {patient.name}
          </h2>
          <Badge variant="neutral" style={{ background: 'rgba(255,255,255,.18)', color: 'white', border: '1px solid rgba(255,255,255,.3)' }}>
            {patient.id}
          </Badge>
        </div>

        <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.78)', marginTop: 5 }}>
          {age} years · {patient.gender} · Registered {patient.registered}
        </div>

        {/* Key stats row */}
        <div className="portal-stats-row">
          {[
            { label: 'Blood Group', value: patient.bloodGroup, color: '#fca5a5' },
            { label: 'Genotype',    value: patient.genotype,   color: '#93c5fd' },
            { label: 'Insurance',   value: patient.insurance,  color: '#6ee7b7' },
          ].map(s => (
            <div key={s.label} className="portal-stat-chip">
              <div style={{ fontSize: '.64rem', opacity: .75, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact quick-look */}
      <div className="portal-contact-panel">
        {[
          [<IcPhone width={12} height={12} />, patient.phone],
          [<IcMail  width={12} height={12} />, patient.email],
          [<IcMapPin width={12} height={12} />, `${(patient.address ?? '').slice(0, 28)}…`],
        ].map(([ic, val], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.77rem', color: 'rgba(255,255,255,.82)', marginBottom: 5 }}>
            <span style={{ opacity: .7 }}>{ic}</span> {val}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertBanner({ patient }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      {(patient.allergies ?? []).map(a => (
        <div key={a} className="portal-allergy-tag">
          <IcWarning width={12} height={12} /> Allergy: {a}
        </div>
      ))}
      {(patient.conditions ?? []).map(c => (
        <div key={c} className="portal-condition-tag">
          <IcHeartPulse width={12} height={12} /> {c}
        </div>
      ))}
    </div>
  );
}

/* ── VISITS TAB ──────────────────────────────────────────── */
function VisitsTab({ visits }) {
  const firstId = visits[0]?.id;
  const [expanded, setExpanded] = useState(() => firstId ? new Set([firstId]) : new Set());
  const toggle = id => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  if (visits.length === 0) {
    return <EmptyState title="No visits recorded" icon={<IcHistory width={24} height={24} />} />;
  }

  return (
    <div className="portal-timeline">
      {visits.map((v, i) => {
        const isExp = expanded.has(v.id);
        const dateObj = new Date(v.date);
        const isLatest = i === 0;

        return (
          <div key={v.id} className="timeline-item">
            {/* Date column */}
            <div className="timeline-date-col">
              <div className="timeline-month">
                {dateObj.toLocaleDateString('en-NG', { month: 'short' })}
              </div>
              <div className="timeline-day">
                {dateObj.getDate()}
              </div>
              <div className="timeline-year">
                {dateObj.getFullYear()}
              </div>
            </div>

            {/* Dot + line */}
            <div className="timeline-connector">
              <div className={`timeline-dot${isLatest ? ' latest' : ''}`} />
              {i < visits.length - 1 && <div className="timeline-line" />}
            </div>

            {/* Card */}
            <div className="timeline-card" onClick={() => toggle(v.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text-900)', marginBottom: 4 }}>
                    {v.chief}
                  </div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-400)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span><IcStethoscope width={10} height={10} style={{ marginRight: 4 }} />{v.doctor}</span>
                    <span><IcClock width={10} height={10} style={{ marginRight: 4 }} />{v.time}</span>
                    <span>{v.id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {isLatest && <Badge variant="primary">Latest</Badge>}
                  <Badge variant="success">Completed</Badge>
                </div>
              </div>

              {isExp && (
                <div className="timeline-expanded" onClick={e => e.stopPropagation()}>
                  {/* Vitals */}
                  <div className="vitals-mini-grid">
                    {[
                      { label: 'BP',    value: v.vitals.bp,              unit: 'mmHg' },
                      { label: 'Pulse', value: String(v.vitals.pulse),   unit: 'bpm', colorKey: 'pulse' },
                      { label: 'Temp',  value: `${v.vitals.temp}°C`,     unit: '',    colorKey: 'temp'  },
                      { label: 'SpO₂',  value: `${v.vitals.spo2}%`,      unit: '',    colorKey: 'spo2'  },
                    ].map(vi => (
                      <div key={vi.label} className="vital-mini-cell">
                        <div style={{ fontSize: '.66rem', color: 'var(--text-400)', marginBottom: 2 }}>{vi.label}</div>
                        <div style={{
                          fontSize: '.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                          color: vi.colorKey ? vitalColor(vi.colorKey, vi.value) : 'var(--text-900)',
                        }}>
                          {vi.value}
                        </div>
                        {vi.unit && <div style={{ fontSize: '.6rem', color: 'var(--text-400)' }}>{vi.unit}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Diagnosis */}
                  <div className="portal-info-block">
                    <div className="portal-info-label">Diagnosis</div>
                    <div className="portal-info-value">{v.diagnosis}</div>
                  </div>

                  <div className="portal-info-block">
                    <div className="portal-info-label">Plan</div>
                    <div className="portal-info-value">{v.plan}</div>
                  </div>

                  {/* Rx */}
                  <div className="portal-info-label" style={{ marginBottom: 6 }}>Prescriptions</div>
                  {v.rx.map((rx, ri) => (
                    <div key={ri} className="rx-mini-row">
                      <IcPill width={11} height={11} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <span>{rx}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── PRESCRIPTIONS TAB ───────────────────────────────────── */
function PrescriptionsTab({ prescriptions }) {
  if (prescriptions.length === 0) {
    return <EmptyState title="No prescriptions found" icon={<IcPill width={24} height={24} />} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {prescriptions.map(rx => (
        <div key={rx.id} className="rx-portal-card">
          <div className="rx-portal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: '.86rem', fontFamily: 'var(--font-mono)', color: 'var(--text-900)' }}>
                  {rx.id}
                </span>
                <Badge variant={rx.status === 'dispensed' ? 'success' : 'neutral'}>
                  {rx.status === 'dispensed' ? 'Dispensed' : 'Completed'}
                </Badge>
              </div>
              <div style={{ fontSize: '.74rem', color: 'var(--text-400)' }}>
                {rx.doctor} · {rx.date}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {rx.drugs.map((d, i) => (
              <div key={i} className="rx-drug-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
                  <div className="rx-pill-icon">
                    <IcPill width={14} height={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>{d.name}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text-500)', marginTop: 2 }}>
                      {d.dose} · {d.freq} · {d.dur}
                    </div>
                  </div>
                </div>
                {d.refills > 0 && (
                  <Badge variant="teal">{d.refills} refills</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── APPOINTMENTS TAB ────────────────────────────────────── */
function AppointmentsTab({ appointments }) {
  const { navigate } = useAppCtx();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {appointments.length === 0 && (
        <EmptyState title="No appointments yet" icon={<IcCalendar width={24} height={24} />} />
      )}
      {appointments.map(apt => {
        const isUpcoming = apt.status === 'upcoming';
        const dateObj    = new Date(apt.date);
        const day        = dateObj.getDate();
        const month      = dateObj.toLocaleDateString('en-NG', { month: 'short' });

        return (
          <div key={apt.id} className={`appt-portal-card${isUpcoming ? ' upcoming' : ''}`}>
            {/* Date badge */}
            <div className="appt-date-badge" style={{ background: isUpcoming ? 'var(--primary)' : 'var(--surface-2)', color: isUpcoming ? 'white' : 'var(--text-500)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, opacity: .8 }}>{month}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>{day}</div>
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text-900)' }}>
                  {apt.type}
                </span>
                <Badge variant={isUpcoming ? 'primary' : 'neutral'}>
                  {isUpcoming ? 'Upcoming' : 'Completed'}
                </Badge>
              </div>
              <div style={{ fontSize: '.76rem', color: 'var(--text-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span><IcStethoscope width={10} height={10} style={{ marginRight: 4 }} />{apt.doctor}</span>
                <span><IcClock width={10} height={10} style={{ marginRight: 4 }} />{apt.time}</span>
              </div>
              {apt.note && (
                <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 4, fontStyle: 'italic' }}>
                  {apt.note}
                </div>
              )}
            </div>

            {isUpcoming && (
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button className="btn btn-primary btn-sm">
                  <IcCheckCircle width={12} height={12} /> Confirm
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Book new */}
      <button
        className="btn btn-outline"
        style={{ width: '100%', marginTop: 4 }}
        onClick={() => navigate('appointments')}
      >
        <IcCalendar width={14} height={14} /> Book New Appointment
      </button>
    </div>
  );
}

/* ── OVERVIEW TAB ────────────────────────────────────────── */
function OverviewTab({ patient }) {
  return (
    <div>
      {/* Active conditions + meds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <Card title="Active Conditions">
          {(patient.conditions ?? []).length === 0
            ? <EmptyState title="No active conditions" icon={<IcHeartPulse width={22} height={22} />} />
            : (patient.conditions ?? []).map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <IcHeartPulse width={13} height={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--text-900)' }}>{c}</span>
                <Badge variant="warning" style={{ marginLeft: 'auto' }}>Active</Badge>
              </div>
          ))}
        </Card>

        <Card title="Current Medications">
          {(patient.medications ?? []).length === 0
            ? <EmptyState title="No medications on file" icon={<IcPill width={22} height={22} />} />
            : (patient.medications ?? []).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < patient.medications.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <IcPill width={12} height={12} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <span style={{ fontSize: '.82rem', color: 'var(--text-700)' }}>{m}</span>
              </div>
          ))}
        </Card>
      </div>

      {/* Personal details */}
      <Card title="Personal Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            ['Date of Birth', patient.dob],
            ['Phone',         patient.phone],
            ['Email',         patient.email],
            ['NIN',           patient.nin],
            ['Insurance No.', patient.insNumber],
            ['Emergency Contact', `${patient.ecName} (${patient.ecRelation}) · ${patient.ecPhone}`],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '.84rem', color: 'var(--text-700)', fontWeight: 600 }}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function PatientPortalPage() {
  const { user }  = useAuth();
  const [tab, setTab] = useState('overview');

  const [patient,       setPatient]       = useState(normalisePatient(PATIENT));
  const [visits,        setVisits]        = useState(VISITS.map(normaliseVisit));
  const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS.map(normaliseRx));
  const [appointments,  setAppointments]  = useState(APPOINTMENTS.map(normaliseAppt));
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        /* 1. Resolve patient record — look up by logged-in user's email */
        const email = user?.email;
        let pid = null;

        if (email) {
          const pRes = await api.get(`/api/v1/patients?q=${encodeURIComponent(email)}&limit=1`);
          const pRow = pRes.patients?.[0] ?? pRes.patient ?? null;
          if (pRow && !cancelled) {
            setPatient(normalisePatient(pRow));
            pid = pRow.id ?? pRow.patient_id;
          }
        }

        if (!pid) return; // no patient record linked to this user — keep mock

        /* 2. Parallel load visits + appointments */
        const [vRes, aRes] = await Promise.all([
          api.get(`/api/v1/visits?patientId=${pid}&limit=20`),
          api.get(`/api/v1/appointments?patientId=${pid}&limit=20`),
        ]);

        if (cancelled) return;

        if (vRes.visits?.length) {
          setVisits(vRes.visits.map(normaliseVisit));
          /* Extract prescriptions from visit data */
          const rxList = vRes.visits
            .filter(v => v.prescriptions?.length)
            .map(v => normaliseRx({ ...v, drugs: v.prescriptions }));
          if (rxList.length) setPrescriptions(rxList);
        }

        if (aRes.appointments?.length) {
          setAppointments(aRes.appointments.map(normaliseAppt));
        }
      } catch {
        /* silently keep mock data */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.email]);

  const TABS = [
    { key: 'overview',      label: 'Overview',       icon: <IcPerson      width={14} height={14} /> },
    { key: 'visits',        label: 'Visit History',  icon: <IcHistory     width={14} height={14} /> },
    { key: 'prescriptions', label: 'Prescriptions',  icon: <IcPill        width={14} height={14} /> },
    { key: 'appointments',  label: 'Appointments',   icon: <IcCalendar    width={14} height={14} /> },
  ];

  return (
    <div className="portal-root anim-fade-up">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">My <span>Health Records</span></div>
          <div className="page-subtitle">Your complete medical history and upcoming appointments</div>
        </div>
        {loading && <span style={{ fontSize: '.78rem', color: 'var(--text-400)' }}>Loading…</span>}
      </div>

      {/* Profile card */}
      <ProfileHeader patient={patient} />

      {/* Allergy + condition tags */}
      <AlertBanner patient={patient} />

      {/* Tab navigation */}
      <div className="portal-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`portal-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="portal-content">
        {tab === 'overview'      && <OverviewTab      patient={patient} />}
        {tab === 'visits'        && <VisitsTab        visits={visits} />}
        {tab === 'prescriptions' && <PrescriptionsTab prescriptions={prescriptions} />}
        {tab === 'appointments'  && <AppointmentsTab  appointments={appointments} />}
      </div>
    </div>
  );
}
