/**
 * Step 10 — Appointment Booking
 * 4-step flow: Patient & Type → Doctor → Date & Time → Confirm
 */

import { useState, useEffect, useRef } from 'react';
import { useToast }  from '../components/Toast';
import { api }       from '../lib/api';
import { useAppCtx } from '../context/AppContext';
import StepsBar      from '../components/StepsBar';
import Badge         from '../components/Badge';
import Alert         from '../components/Alert';
import {
  IcPerson, IcCalendar, IcCalendarCheck, IcClock,
  IcStethoscope, IcCheckCircle, IcArrowRight, IcArrowLeft,
  IcPhone, IcMail, IcMapPin, IcWarning,
} from '../components/Icons';

/* ── constants ───────────────────────────────────────────── */
const STEPS = ['Patient & Type', 'Doctor', 'Date & Time', 'Confirm'];

const APPT_TYPES = [
  { key: 'general',    label: 'General Consultation', icon: <IcStethoscope width={18} height={18} />, duration: 30 },
  { key: 'followup',   label: 'Follow-up Visit',       icon: <IcCalendar    width={18} height={18} />, duration: 20 },
  { key: 'specialist', label: 'Specialist Referral',   icon: <IcPerson      width={18} height={18} />, duration: 45 },
  { key: 'antenatal',  label: 'Antenatal Care',        icon: <IcCalendar    width={18} height={18} />, duration: 30 },
  { key: 'lab',        label: 'Lab / Investigation',   icon: <IcCheckCircle width={18} height={18} />, duration: 15 },
  { key: 'emergency',  label: 'Urgent Care',           icon: <IcWarning     width={18} height={18} />, duration: 60 },
];

const DOCTORS = [
  { id: 1, name: 'Dr. Emeka Nwosu',    specialty: 'General Medicine',   avail: 8,  rating: 4.9, yrs: 12 },
  { id: 2, name: 'Dr. Adaeze Ibe',     specialty: 'Obstetrics & Gynaecology', avail: 5, rating: 4.8, yrs: 9  },
  { id: 3, name: 'Dr. Chukwudi Obi',   specialty: 'Internal Medicine',  avail: 11, rating: 4.7, yrs: 15 },
  { id: 4, name: 'Dr. Fatima Bello',   specialty: 'Paediatrics',        avail: 6,  rating: 4.9, yrs: 8  },
  { id: 5, name: 'Dr. Segun Adeleke',  specialty: 'Surgery',            avail: 3,  rating: 4.6, yrs: 20 },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
];

/* slots already taken per day (demo) */
const TAKEN_SLOTS = {
  0: ['09:00', '10:30', '14:00'],
  1: ['08:30', '11:00', '13:00', '15:00'],
  2: ['09:30', '10:00', '14:30'],
  3: ['08:00', '09:00', '11:30'],
  4: ['10:00', '13:30'],
  5: [],
  6: ['08:30', '09:00', '14:00', '15:30'],
};

const REMINDERS = [
  { key: 'sms',       label: 'SMS', icon: <IcPhone   width={14} height={14} /> },
  { key: 'whatsapp',  label: 'WhatsApp', icon: <IcPhone width={14} height={14} /> },
  { key: 'email',     label: 'Email', icon: <IcMail  width={14} height={14} /> },
  { key: 'none',      label: 'No Reminder', icon: null },
];

const PATIENTS_MOCK = [
  { id: 'PT-2026-0012', name: 'Chidi Obi',        age: 34, phone: '08012345678' },
  { id: 'PT-2026-0031', name: 'Amara Eze',         age: 28, phone: '08023456789' },
  { id: 'PT-2026-0047', name: 'Taiwo Adeyemi',     age: 52, phone: '08034567890' },
  { id: 'PT-2026-0058', name: 'Ngozi Okafor',      age: 22, phone: '08045678901' },
  { id: 'PT-2026-0063', name: 'Emeka Dike',        age: 45, phone: '08056789012' },
];

/* ── helpers ──────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const genApptId = () => `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

/* ── Calendar component ───────────────────────────────────── */
function Calendar({ selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells     = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMon }, (_, i) => i + 1)
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === viewMonth &&
           selectedDate.getFullYear() === viewYear;
  };

  const isToday = (day) => {
    return today.getDate() === day &&
           today.getMonth() === viewMonth &&
           today.getFullYear() === viewYear;
  };

  return (
    <div className="cal-wrap">
      {/* Month navigation */}
      <div className="cal-nav">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}>›</button>
      </div>

      {/* Day headers */}
      <div className="cal-grid">
        {DAYS_SHORT.map(d => (
          <div key={d} className="cal-day-hdr">{d}</div>
        ))}

        {/* Date cells */}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const past = isPast(day);
          const sel  = isSelected(day);
          const tod  = isToday(day);
          return (
            <button
              key={day}
              className={`cal-cell${sel ? ' sel' : ''}${tod && !sel ? ' today' : ''}${past ? ' past' : ''}`}
              onClick={() => !past && onSelect(new Date(viewYear, viewMonth, day))}
              disabled={past}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step components ──────────────────────────────────────── */

function Step1({ data, update, errors, selectedPatient, patientSearch, setPatientSearch, patientResults, searching, onSelectPatient }) {
  return (
    <div>
      <div className="appt-step-hd">
        <div className="appt-step-ico" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <IcPerson width={20} height={20} />
        </div>
        <div>
          <div className="appt-step-title">Patient & Appointment Type</div>
          <div className="appt-step-sub">Select the patient and the type of appointment needed</div>
        </div>
      </div>

      {/* Patient search */}
      <div className="form-group" style={{ marginBottom: 20, position: 'relative' }}>
        <label className="form-label">Patient <span className="required">*</span></label>
        {selectedPatient ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
            <IcCheckCircle width={14} height={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '.88rem' }}>
              {selectedPatient.name} · {selectedPatient.id}
            </span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} type="button" onClick={() => onSelectPatient(null)}>Change</button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <input
                className={`input${errors.patientId ? ' error' : ''}`}
                placeholder="Search patient by name, phone, or ID…"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
              {searching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><div className="spinner" style={{ width: 14, height: 14 }} /></div>}
            </div>
            {patientResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50, overflow: 'hidden', marginTop: 2 }}>
                {patientResults.map(p => (
                  <button key={p.id} type="button"
                    style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.84rem', borderBottom: '1px solid var(--border)' }}
                    onClick={() => onSelectPatient(p)}
                  >
                    <span style={{ fontWeight: 700 }}>{p.name || `${p.first_name} ${p.last_name}`}</span>
                    <span style={{ fontSize: '.74rem', color: 'var(--text-400)', marginLeft: 8 }}>{p.id}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {errors.patientId && (
          <div className="form-error" style={{ marginTop: 6 }}><IcWarning width={12} height={12} /> {errors.patientId}</div>
        )}
      </div>

      {/* Appointment type grid */}
      <div className="form-group">
        <label className="form-label">Appointment Type <span className="required">*</span></label>
        {errors.apptType && (
          <div className="form-error" style={{ marginBottom: 8 }}><IcWarning width={12} height={12} /> {errors.apptType}</div>
        )}
        <div className="appt-type-grid">
          {APPT_TYPES.map(t => (
            <button
              key={t.key}
              className={`appt-type-card${data.apptType === t.key ? ' selected' : ''}`}
              onClick={() => update('apptType', t.key)}
              type="button"
            >
              <div className="appt-type-icon">{t.icon}</div>
              <div className="appt-type-label">{t.label}</div>
              <div className="appt-type-dur">{t.duration} min</div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Reason / Notes <span style={{ color: 'var(--text-400)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="e.g. Follow-up on hypertension medications, recurring chest pain…"
          value={data.notes}
          onChange={e => update('notes', e.target.value)}
          style={{ resize: 'none' }}
        />
      </div>
    </div>
  );
}

function Step2({ data, update, errors, doctors = DOCTORS }) {
  return (
    <div>
      <div className="appt-step-hd">
        <div className="appt-step-ico" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}>
          <IcStethoscope width={20} height={20} />
        </div>
        <div>
          <div className="appt-step-title">Choose a Doctor</div>
          <div className="appt-step-sub">Select based on specialty and availability</div>
        </div>
      </div>

      {errors.doctorId && (
        <Alert type="warning" style={{ marginBottom: 14 }}>
          <IcWarning width={14} height={14} /> Please select a doctor before continuing.
        </Alert>
      )}

      <div className="doctor-grid">
        {DOCTORS.map(doc => (
          <button
            key={doc.id}
            className={`doctor-card${data.doctorId === doc.id ? ' selected' : ''}`}
            onClick={() => update('doctorId', doc.id)}
            type="button"
          >
            {/* Avatar */}
            <div className="doctor-av">
              {doc.name.split(' ').slice(1).map(n => n[0]).join('')}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="doctor-name">{doc.name}</div>
              <div className="doctor-spec">{doc.specialty}</div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="doctor-meta">
                  ★ {doc.rating}
                </span>
                <span className="doctor-meta">
                  {doc.yrs} yrs exp
                </span>
                <Badge variant={doc.avail > 5 ? 'success' : doc.avail > 2 ? 'warning' : 'danger'}>
                  {doc.avail} slots
                </Badge>
              </div>
            </div>

            {data.doctorId === doc.id && (
              <IcCheckCircle width={18} height={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3({ data, update, errors }) {
  const dayOfWeek = data.date ? data.date.getDay() : 0;
  const takenToday = TAKEN_SLOTS[dayOfWeek] ?? [];

  return (
    <div>
      <div className="appt-step-hd">
        <div className="appt-step-ico" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
          <IcCalendar width={20} height={20} />
        </div>
        <div>
          <div className="appt-step-title">Pick Date &amp; Time</div>
          <div className="appt-step-sub">Choose an available appointment slot</div>
        </div>
      </div>

      <div className="datetime-layout">
        {/* Calendar */}
        <div>
          {errors.date && (
            <div className="form-error" style={{ marginBottom: 8 }}>
              <IcWarning width={12} height={12} /> {errors.date}
            </div>
          )}
          <Calendar
            selectedDate={data.date}
            onSelect={d => { update('date', d); update('time', ''); }}
          />
        </div>

        {/* Time slots */}
        <div>
          <div className="form-label" style={{ marginBottom: 10 }}>
            Available Times
            {data.date && (
              <span style={{ fontWeight: 400, color: 'var(--text-400)', marginLeft: 8 }}>
                {data.date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          {!data.date && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-400)', fontSize: '.84rem' }}>
              <IcCalendar width={28} height={28} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--border-dark)' }} />
              Select a date to see available slots
            </div>
          )}

          {errors.time && (
            <div className="form-error" style={{ marginBottom: 8 }}>
              <IcWarning width={12} height={12} /> {errors.time}
            </div>
          )}

          {data.date && (
            <div className="time-grid">
              {TIME_SLOTS.map(slot => {
                const taken = takenToday.includes(slot);
                const sel   = data.time === slot;
                return (
                  <button
                    key={slot}
                    className={`time-slot${sel ? ' sel' : ''}${taken ? ' taken' : ''}`}
                    onClick={() => !taken && update('time', slot)}
                    disabled={taken}
                    title={taken ? 'Already booked' : `Book ${slot}`}
                  >
                    <IcClock width={11} height={11} />
                    {slot}
                    {taken && <span style={{ fontSize: '.6rem', display: 'block', color: 'var(--text-400)' }}>Taken</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          {data.date && (
            <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: '.72rem', color: 'var(--text-400)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--primary)', display: 'inline-block' }} />
                Selected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'inline-block' }} />
                Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--surface-2)', border: '1px dashed var(--border-dark)', display: 'inline-block' }} />
                Taken
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step4({ data, apptId }) {
  const patient = PATIENTS_MOCK.find(p => p.id === data.patientId);
  const doctor  = DOCTORS.find(d => d.id === data.doctorId);
  const apptType = APPT_TYPES.find(t => t.key === data.apptType);
  const dateStr = data.date?.toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div>
      <div className="appt-step-hd">
        <div className="appt-step-ico" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
          <IcCalendarCheck width={20} height={20} />
        </div>
        <div>
          <div className="appt-step-title">Confirm Appointment</div>
          <div className="appt-step-sub">Review details before booking</div>
        </div>
      </div>

      {/* Appointment ID banner */}
      <div className="appt-confirm-banner">
        <div>
          <div style={{ fontSize: '.7rem', opacity: .75, marginBottom: 3 }}>Appointment ID</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
            {apptId}
          </div>
        </div>
        <IcCalendarCheck width={26} height={26} style={{ opacity: .8 }} />
      </div>

      {/* Summary */}
      <div className="appt-confirm-rows">
        {[
          ['Patient',   `${patient?.name} (${patient?.id})`],
          ['Type',      apptType?.label],
          ['Duration',  `${apptType?.duration} minutes`],
          ['Doctor',    `${doctor?.name} · ${doctor?.specialty}`],
          ['Date',      dateStr],
          ['Time',      data.time],
          ['Notes',     data.notes || 'None'],
        ].map(([label, value]) => (
          <div key={label} className="appt-confirm-row">
            <span className="appt-confirm-label">{label}</span>
            <span className="appt-confirm-value">{value || '—'}</span>
          </div>
        ))}
      </div>

      {/* Reminder selector */}
      <div className="form-group" style={{ marginTop: 18 }}>
        <label className="form-label">Send Reminder Via</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {REMINDERS.map(r => (
            <button
              key={r.key}
              type="button"
              className={`reminder-btn${data.reminder === r.key ? ' selected' : ''}`}
              onClick={() => {}}
            >
              {r.icon}
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Alert type="info" style={{ marginTop: 14, fontSize: '.8rem' }}>
        <IcCalendarCheck width={14} height={14} />
        A confirmation will be sent to {patient?.name} after booking.
      </Alert>
    </div>
  );
}

/* ── validation ───────────────────────────────────────────── */
function validate(step, data) {
  const e = {};
  if (step === 0) {
    if (!data.patientId) e.patientId = 'Please select a patient';
    if (!data.apptType)  e.apptType  = 'Please select an appointment type';
  }
  if (step === 1) {
    if (!data.doctorId) e.doctorId = 'Please select a doctor';
  }
  if (step === 2) {
    if (!data.date) e.date = 'Please select a date';
    if (!data.time) e.time = 'Please select a time slot';
  }
  return e;
}

/* ── main component ───────────────────────────────────────── */
export default function AppointmentsPage() {
  const toast        = useToast();
  const { navigate } = useAppCtx();

  const [step,     setStep]     = useState(0);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [apptId,   setApptId]   = useState(genApptId);

  /* Patient search state */
  const [patientSearch,  setPatientSearch]  = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const ptSearchTimer = useRef(null);

  useEffect(() => {
    if (!patientSearch.trim()) { setPatientResults([]); return; }
    clearTimeout(ptSearchTimer.current);
    ptSearchTimer.current = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const { patients } = await api.get(`/api/v1/patients?q=${encodeURIComponent(patientSearch)}&limit=6`);
        setPatientResults((patients ?? []).map(p => ({
          ...p, name: `${p.first_name} ${p.last_name}`,
        })));
      } catch { setPatientResults(PATIENTS_MOCK.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()))); }
      finally   { setPatientSearching(false); }
    }, 300);
  }, [patientSearch]);

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    if (p) update('patientId', p.id);
    else   update('patientId', '');
    setPatientSearch('');
    setPatientResults([]);
  };

  /* Real doctors from API */
  const [doctors, setDoctors] = useState(DOCTORS);
  useEffect(() => {
    api.get('/api/v1/staff?role=doctor&limit=30')
      .then(({ staff }) => {
        if (staff?.length) {
          setDoctors(staff.map(d => ({
            id:        d.id,
            name:      d.name,
            specialty: d.dept ?? 'General Medicine',
            avail:     Math.floor(3 + Math.random() * 10),
            rating:    4.7,
            yrs:       d.years_exp ?? 5,
          })));
        }
      })
      .catch(() => { /* keep mock doctors */ });
  }, []);

  const [data, setData] = useState({
    patientId: '', apptType: '', notes: '',
    doctorId: null, date: null, time: '',
    reminder: 'sms',
  });

  const update = (field, value) => {
    setData(d => ({ ...d, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const next = () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const submit = async () => {
    setLoading(true);
    try {
      const dateISO = data.date ? data.date.toISOString().split('T')[0] : '';
      const result  = await api.post('/api/v1/appointments', {
        patientId: data.patientId,
        doctorId:  data.doctorId,
        type:      data.apptType,
        date:      dateISO,
        time:      data.time,
        notes:     data.notes || undefined,
        reminder:  data.reminder,
      });
      setApptId(result.appointment?.id ?? apptId);
      setDone(true);
      const patient = PATIENTS_MOCK.find(p => p.id === data.patientId) ?? { name: data.patientId };
      const doctor  = doctors.find(d => d.id === data.doctorId)        ?? { name: 'Doctor' };
      const dateStr = data.date?.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
      toast.success(`${result.appointment?.id ?? apptId} booked for ${patient.name} with ${doctor.name} on ${dateStr} at ${data.time}.`, 'Appointment Booked');
    } catch (err) {
      toast.error(err.message ?? 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── success ── */
  if (done) {
    const patient  = PATIENTS_MOCK.find(p => p.id === data.patientId);
    const doctor   = DOCTORS.find(d => d.id === data.doctorId);
    const dateStr  = data.date?.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="appt-success anim-scale-in">
        <div className="appt-success-icon">
          <IcCalendarCheck width={36} height={36} />
        </div>
        <h2 className="appt-success-title">Appointment Booked!</h2>
        <p className="appt-success-sub">
          {patient?.name}'s appointment has been confirmed.
        </p>
        <div className="appt-confirm-banner" style={{ maxWidth: 380, margin: '18px auto' }}>
          <div>
            <div style={{ fontSize: '.7rem', opacity: .75, marginBottom: 3 }}>Appointment ID</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
              {apptId}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '.82rem', opacity: .85 }}>
            <div style={{ fontWeight: 700 }}>{data.time}</div>
            <div>{dateStr}</div>
          </div>
        </div>

        <div style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 22 }}>
          {doctor?.name} · {doctor?.specialty}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setData({ patientId:'', apptType:'', notes:'', doctorId:null, date:null, time:'', reminder:'sms' });
              setStep(0); setDone(false);
            }}
          >
            <IcCalendar width={14} height={14} /> Book Another
          </button>
          <button className="btn btn-outline" onClick={() => navigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appt-root anim-fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Book <span>Appointment</span></div>
          <div className="page-subtitle">Schedule a patient visit in 4 quick steps</div>
        </div>
        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem' }}>
          {apptId}
        </span>
      </div>

      <StepsBar steps={STEPS} current={step} />

      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        {step === 0 && <Step1 data={data} update={update} errors={errors}
          selectedPatient={selectedPatient} patientSearch={patientSearch}
          setPatientSearch={setPatientSearch} patientResults={patientResults}
          searching={patientSearching} onSelectPatient={handleSelectPatient} />}
        {step === 1 && <Step2 data={data} update={update} errors={errors} doctors={doctors} />}
        {step === 2 && <Step3 data={data} update={update} errors={errors} />}
        {step === 3 && <Step4 data={data} apptId={apptId} />}

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)',
        }}>
          <button className="btn btn-outline" onClick={back} disabled={step === 0}>
            <IcArrowLeft width={14} height={14} /> Back
          </button>
          <span style={{ fontSize: '.78rem', color: 'var(--text-400)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue <IcArrowRight width={14} height={14} />
            </button>
          ) : (
            <button className="btn btn-success" onClick={submit} disabled={loading}>
              {loading
                ? <><div className="btn-spinner" /> Booking…</>
                : <><IcCalendarCheck width={14} height={14} /> Confirm Booking</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
