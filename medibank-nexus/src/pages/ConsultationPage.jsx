/**
 * Step 8 — Doctor Consultation
 * Patient sidebar · Vitals · Notes & Diagnosis · Prescriptions · AI Summary
 */

import { useState, useEffect, useRef } from 'react';
import { useToast }  from '../components/Toast';
import { useAppCtx } from '../context/AppContext';
import { api }       from '../lib/api';
import Alert         from '../components/Alert';
import Badge         from '../components/Badge';
import Card          from '../components/Card';
import {
  IcPerson, IcHeartPulse, IcStethoscope, IcPill,
  IcCPU, IcCheckCircle, IcWarning, IcPlus, IcTrash,
  IcArrowUp, IcArrowDown, IcSend, IcFileMedical,
  IcClock, IcHistory,
} from '../components/Icons';

/* ── Patient search helpers ──────────────────────────────────── */
function normalisePatient(p) {
  /* Converts DB row → component-friendly shape */
  const dob = p.dob ? new Date(p.dob) : null;
  const age  = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)) : null;
  return {
    id:          p.id,
    name:        `${p.first_name} ${p.last_name}`,
    age:         age ?? '?',
    gender:      p.gender   ?? '',
    bloodGroup:  p.blood_group ?? '',
    genotype:    p.genotype   ?? '',
    allergies:   Array.isArray(p.allergies)  ? p.allergies  : [],
    conditions:  Array.isArray(p.conditions) ? p.conditions : [],
    medications: Array.isArray(p.medications)? p.medications: [],
    history:     [],   /* loaded separately on select */
  };
}

const DRUG_LIST = [
  'Amoxicillin 500mg', 'Artemether/Lumefantrine', 'Azithromycin 250mg',
  'Ciprofloxacin 500mg', 'Diclofenac 50mg', 'Doxycycline 100mg',
  'Ibuprofen 400mg', 'Lisinopril 10mg', 'Metformin 500mg',
  'Metronidazole 400mg', 'Omeprazole 20mg', 'Paracetamol 1000mg',
  'Prednisolone 5mg', 'Vitamin C 500mg', 'Zinc 20mg',
];

const FREQS   = ['Once daily', 'Twice daily (bd)', 'Three times daily (tds)', 'Four times daily (qds)', 'At night (nocte)', 'As needed (prn)'];
const DURS    = ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days', '3 months', 'Ongoing'];
const ROUTES  = ['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Sublingual'];

const emptyRx = () => ({ id: Date.now(), drug: '', dose: '', freq: '', duration: '', route: 'Oral', notes: '' });

/* ── Vitals defaults ──────────────────────────────────────  */
const emptyVitals = () => ({
  bpSys: '', bpDia: '', pulse: '', temp: '', spo2: '', rr: '', weight: '', height: '',
});

/* ── Vital status helper ─────────────────────────────────── */
function vitalStatus(key, val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  const ranges = {
    bpSys:  { low: 90,  high: 140 },
    bpDia:  { low: 60,  high: 90  },
    pulse:  { low: 60,  high: 100 },
    temp:   { low: 36.1,high: 37.5 },
    spo2:   { low: 95,  high: 101 },
    rr:     { low: 12,  high: 20  },
  };
  const r = ranges[key];
  if (!r) return null;
  if (n < r.low)  return 'low';
  if (n > r.high) return 'high';
  return 'normal';
}

const vitalColor = (s) => ({ low: 'var(--primary)', high: 'var(--danger)', normal: 'var(--success)' }[s] ?? 'var(--text-700)');

/* ── small components ────────────────────────────────────── */
function VitalInput({ label, value, onChange, unit, field, placeholder }) {
  const status = vitalStatus(field, value);
  return (
    <div className="vital-cell">
      <label className="vital-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input vital-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type="number"
          style={{ paddingRight: unit ? 38 : 12, color: status ? vitalColor(status) : undefined, fontWeight: status ? 700 : undefined }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '.72rem', color: 'var(--text-400)', pointerEvents: 'none' }}>
            {unit}
          </span>
        )}
      </div>
      {status && status !== 'normal' && (
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: vitalColor(status), display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
          {status === 'high' ? <IcArrowUp width={10} height={10} /> : <IcArrowDown width={10} height={10} />}
          {status === 'high' ? 'HIGH' : 'LOW'}
        </div>
      )}
    </div>
  );
}

function RxRow({ rx, onChange, onRemove, patient }) {
  const allergyMatch = patient.allergies.some(a =>
    rx.drug.toLowerCase().includes(a.toLowerCase().split(' ')[0])
  );

  return (
    <div className="rx-row">
      {allergyMatch && (
        <Alert type="danger" style={{ marginBottom: 8, fontSize: '.78rem' }}>
          <IcWarning width={13} height={13} />
          Allergy conflict: patient is allergic to components of <strong>{rx.drug}</strong>
        </Alert>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label">Drug / Medication</label>
          <select className="select" value={rx.drug} onChange={e => onChange({ ...rx, drug: e.target.value })}>
            <option value="">Select drug…</option>
            {DRUG_LIST.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Dose</label>
          <input className="input" placeholder="e.g. 500mg" value={rx.dose} onChange={e => onChange({ ...rx, dose: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <select className="select" value={rx.freq} onChange={e => onChange({ ...rx, freq: e.target.value })}>
            <option value="">Frequency…</option>
            {FREQS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Duration</label>
          <select className="select" value={rx.duration} onChange={e => onChange({ ...rx, duration: e.target.value })}>
            <option value="">Duration…</option>
            {DURS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Route</label>
          <select className="select" value={rx.route} onChange={e => onChange({ ...rx, route: e.target.value })}>
            {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          style={{ color: 'var(--danger)', marginBottom: 1 }}
          onClick={onRemove}
          title="Remove drug"
        >
          <IcTrash width={14} height={14} />
        </button>
      </div>
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Special Instructions</label>
        <input className="input" placeholder="e.g. Take with food, avoid sunlight" value={rx.notes} onChange={e => onChange({ ...rx, notes: e.target.value })} />
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function ConsultationPage() {
  const toast        = useToast();
  const { navigate } = useAppCtx();

  /* Patient search */
  const [searchQ,    setSearchQ]    = useState('');
  const [searchRes,  setSearchRes]  = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [patient,    setPatient]    = useState(null);
  const searchTimer = useRef(null);

  const [tab,        setTab]        = useState('notes');
  const [vitals,     setVitals]     = useState(emptyVitals);
  const [chief,      setChief]      = useState('');
  const [hpi,        setHpi]        = useState('');
  const [diagnosis,  setDiagnosis]  = useState('');
  const [plan,       setPlan]       = useState('');
  const [rxList,     setRxList]     = useState([emptyRx()]);
  const [aiSummary,  setAiSummary]  = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Live patient search */
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { patients } = await api.get(`/api/v1/patients?q=${encodeURIComponent(searchQ)}&limit=8`);
        setSearchRes((patients ?? []).map(normalisePatient));
      } catch { setSearchRes([]); }
      finally   { setSearching(false); }
    }, 300);
  }, [searchQ]);

  /* Load visit history when a patient is selected */
  const selectPatient = async (p) => {
    setPatient(p);
    setSearchQ('');
    setSearchRes([]);
    /* Fetch past visits for this patient */
    try {
      const { visits } = await api.get(`/api/v1/visits?patientId=${p.id}&limit=5`);
      setPatient(prev => ({
        ...prev,
        history: (visits ?? []).map(v => ({
          date: v.date?.split('T')[0] ?? v.created_at?.split('T')[0],
          dx:   v.diagnosis ?? v.chief ?? '—',
          rx:   '—',
        })),
      }));
    } catch { /* history stays empty */ }
  };

  const updateVital = (k, v) => setVitals(prev => ({ ...prev, [k]: v }));
  const updateRx    = (id, updated) => setRxList(prev => prev.map(r => r.id === id ? updated : r));
  const removeRx    = (id) => setRxList(prev => prev.filter(r => r.id !== id));
  const addRx       = () => setRxList(prev => [...prev, emptyRx()]);

  /* AI clinical summary — routes through backend proxy */
  const generateSummary = async () => {
    if (!patient) { toast.warning('Select a patient first'); return; }
    setAiLoading(true);
    setAiSummary('');
    setTab('ai');

    try {
      const result = await api.post('/api/v1/ai/summarize-visit', {
        patientId:   patient.id,
        patientName: patient.name,
        age:         patient.age,
        gender:      patient.gender,
        bloodGroup:  patient.bloodGroup,
        genotype:    patient.genotype,
        allergies:   patient.allergies,
        conditions:  patient.conditions,
        medications: patient.medications,
        vitals: {
          bp:    `${vitals.bpSys}/${vitals.bpDia}`,
          pulse: vitals.pulse,
          temp:  vitals.temp,
          spo2:  vitals.spo2,
          rr:    vitals.rr,
        },
        chief, hpi, diagnosis, plan,
        prescriptions: rxList.filter(r => r.drug).map(r => ({
          drug: r.drug, dose: r.dose, frequency: r.freq, duration: r.duration, route: r.route, notes: r.notes,
        })),
      });
      setAiSummary(result.content?.[0]?.text ?? result.summary ?? 'Unable to generate summary.');
    } catch (err) {
      setAiSummary(`Error: ${err.message ?? 'Could not generate summary. Please try again.'}`);
    }
    setAiLoading(false);
  };

  /* Sign & Submit */
  const handleSubmit = async () => {
    if (!patient) {
      toast.warning('Please select a patient first.');
      return;
    }
    if (!chief.trim() || !diagnosis.trim()) {
      toast.warning('Chief complaint and diagnosis are required before signing.');
      setTab('notes');
      return;
    }
    setSubmitting(true);
    try {
      /* 1. Save visit record */
      const { visit } = await api.post('/api/v1/visits', {
        patientId: patient.id,
        chief, hpi, diagnosis, plan,
        bp:     vitals.bpSys && vitals.bpDia ? `${vitals.bpSys}/${vitals.bpDia}` : undefined,
        pulse:  vitals.pulse   || undefined,
        temp:   vitals.temp    || undefined,
        spo2:   vitals.spo2    || undefined,
        rr:     vitals.rr      || undefined,
        weight: vitals.weight  || undefined,
      });

      /* 2. Save prescriptions if any */
      const drugs = rxList.filter(r => r.drug);
      if (drugs.length > 0) {
        await api.post(`/api/v1/visits/${visit.id}/prescriptions`, {
          items: drugs.map(r => ({
            drug:      r.drug,
            dose:      r.dose,
            frequency: r.freq,
            duration:  r.duration,
            route:     r.route,
            notes:     r.notes,
          })),
        });
      }

      setSubmitted(true);
      toast.success(`Visit for ${patient.name} signed and sent to pharmacy.`, 'Consultation Complete');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save visit. Please try again.', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── success ── */
  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: '0 16px' }} className="anim-scale-in">
        <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-2xl)', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 0 10px rgba(5,150,105,.08)' }}>
          <IcCheckCircle width={36} height={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.03em', marginBottom: 8 }}>Consultation Signed</h2>
        <p style={{ color: 'var(--text-500)', fontSize: '.88rem', lineHeight: 1.7, marginBottom: 24 }}>
          Visit note for <strong>{patient?.name}</strong> has been saved and the prescription sent to the pharmacy queue.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => {
            setSubmitted(false); setPatient(null); setSearchQ(''); setSearchRes([]);
            setVitals(emptyVitals()); setChief(''); setHpi(''); setDiagnosis('');
            setPlan(''); setRxList([emptyRx()]); setAiSummary(''); setTab('notes');
          }}>
            <IcStethoscope width={14} height={14} /> New Consultation
          </button>
          <button className="btn btn-outline" onClick={() => navigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── main layout ── */
  return (
    <div className="consult-root anim-fade-up">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Consultation <span>Room</span></div>
          <div className="page-subtitle">Document visit, record vitals, prescribe medications</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={generateSummary}>
            <IcCPU width={14} height={14} /> AI Summary
          </button>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <><div className="btn-spinner" /> Signing…</>
              : <><IcCheckCircle width={14} height={14} /> Sign &amp; Submit</>
            }
          </button>
        </div>
      </div>

      <div className="consult-layout">

        {/* ── LEFT SIDEBAR — patient info ── */}
        <aside className="consult-sidebar">

          {/* Patient search */}
          <div className="card" style={{ marginBottom: 12, position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: 10 }}>
              <div className="card-title">Search Patient</div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="Name, phone, or patient ID…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {searching && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                </div>
              )}
            </div>
            {searchRes.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                zIndex: 100, overflow: 'hidden', marginTop: 4,
              }}>
                {searchRes.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      textAlign: 'left', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '.84rem', borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    onClick={() => selectPatient(p)}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-900)' }}>{p.name}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text-400)' }}>
                      {p.id} · {p.age}y {p.gender}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {patient && (
              <div style={{ marginTop: 8, fontSize: '.78rem', color: 'var(--success)', fontWeight: 700 }}>
                Selected: {patient.name} ({patient.id})
              </div>
            )}
          </div>

          {/* Patient card — shown only after selection */}
          {!patient && (
            <div className="card" style={{ marginBottom: 12, textAlign: 'center', padding: '24px 16px', color: 'var(--text-400)' }}>
              <IcPerson width={28} height={28} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--border-dark)' }} />
              <div style={{ fontSize: '.84rem' }}>Search and select a patient to begin consultation</div>
            </div>
          )}
          {patient && <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)', fontWeight: 800, fontSize: '.9rem' }}>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)' }}>{patient.name}</div>
                <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2 }}>
                  {patient.age}y · {patient.gender} · {patient.id}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['Blood Group', patient.bloodGroup, 'var(--primary)'],
                ['Genotype',    patient.genotype,   'var(--teal)'],
              ].map(([lbl, val, c]) => (
                <div key={lbl} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '.67rem', color: 'var(--text-400)', marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: c }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Allergy flags */}
            {patient.allergies.length > 0 && (
              <Alert type="danger" style={{ marginBottom: 10, fontSize: '.78rem' }}>
                <strong>Allergies:</strong> {patient.allergies.join(', ')}
              </Alert>
            )}

            {/* Conditions */}
            {patient.conditions.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div className="section-divider" style={{ marginBottom: 6 }}>Conditions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {patient.conditions.map(c => (
                    <Badge key={c} variant="warning">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Current meds */}
            {patient.medications.length > 0 && (
              <div>
                <div className="section-divider" style={{ marginBottom: 6 }}>Current Meds</div>
                {patient.medications.map(m => (
                  <div key={m} style={{ fontSize: '.78rem', color: 'var(--text-700)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <IcPill width={11} height={11} style={{ color: 'var(--teal)', marginRight: 5 }} />
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>}

          {/* Visit history */}
          {patient && <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">
                <IcHistory width={14} height={14} style={{ marginRight: 6 }} />
                Past Visits
              </div>
            </div>
            {patient.history.length === 0 && (
              <div style={{ fontSize: '.82rem', color: 'var(--text-400)', textAlign: 'center', padding: '12px 0' }}>
                No past visits on record
              </div>
            )}
            {patient.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: i < patient.history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginBottom: 2 }}>{h.date}</div>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-900)' }}>{h.dx}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-500)', marginTop: 2 }}>
                    <IcPill width={10} height={10} style={{ color: 'var(--teal)' }} /> {h.rx}
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </aside>

        {/* ── RIGHT — main consultation panel ── */}
        <div className="consult-main">

          {/* Vitals grid */}
          <Card title="Vital Signs" style={{ marginBottom: 16 }}>
            <div className="vitals-grid">
              <VitalInput label="Systolic BP"  field="bpSys"  value={vitals.bpSys}  onChange={v => updateVital('bpSys',  v)} unit="mmHg" placeholder="e.g. 120" />
              <VitalInput label="Diastolic BP" field="bpDia"  value={vitals.bpDia}  onChange={v => updateVital('bpDia',  v)} unit="mmHg" placeholder="e.g. 80"  />
              <VitalInput label="Pulse Rate"   field="pulse"  value={vitals.pulse}  onChange={v => updateVital('pulse',  v)} unit="bpm"  placeholder="e.g. 72"  />
              <VitalInput label="Temperature"  field="temp"   value={vitals.temp}   onChange={v => updateVital('temp',   v)} unit="°C"   placeholder="e.g. 36.6" />
              <VitalInput label="SpO₂"         field="spo2"   value={vitals.spo2}   onChange={v => updateVital('spo2',   v)} unit="%"    placeholder="e.g. 98"  />
              <VitalInput label="Resp. Rate"   field="rr"     value={vitals.rr}     onChange={v => updateVital('rr',     v)} unit="/min" placeholder="e.g. 16"  />
            </div>
          </Card>

          {/* Tab bar */}
          <div className="consult-tabs">
            {[
              ['notes', <IcFileMedical width={14} height={14} />, 'Notes & Diagnosis'],
              ['rx',    <IcPill        width={14} height={14} />, 'Prescriptions'],
              ['ai',    <IcCPU         width={14} height={14} />, 'AI Summary'],
            ].map(([key, ic, lbl]) => (
              <button
                key={key}
                className={`consult-tab${tab === key ? ' active' : ''}`}
                onClick={() => setTab(key)}
              >
                {ic} {lbl}
              </button>
            ))}
          </div>

          {/* ── NOTES TAB ── */}
          {tab === 'notes' && (
            <Card>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">
                  Chief Complaint <span className="required">*</span>
                </label>
                <input
                  className="input"
                  value={chief}
                  onChange={e => setChief(e.target.value)}
                  placeholder="e.g. Patient presents with persistent headache and dizziness for 3 days"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">History of Presenting Illness</label>
                <textarea
                  className="textarea"
                  value={hpi}
                  onChange={e => setHpi(e.target.value)}
                  placeholder="Detailed history: onset, duration, character, associated symptoms, aggravating/relieving factors…"
                  rows={4}
                />
              </div>

              <div className="form-row" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">
                    Assessment / Diagnosis <span className="required">*</span>
                  </label>
                  <textarea
                    className="textarea"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Primary and secondary diagnoses, ICD-10 codes if known…"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Management Plan</label>
                  <textarea
                    className="textarea"
                    value={plan}
                    onChange={e => setPlan(e.target.value)}
                    placeholder="Investigations ordered, referrals, follow-up date, lifestyle advice…"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ── RX TAB ── */}
          {tab === 'rx' && (
            <Card
              title="Prescriptions"
              action={
                <button className="btn btn-primary btn-sm" onClick={addRx}>
                  <IcPlus width={13} height={13} /> Add Drug
                </button>
              }
            >
              {rxList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-400)' }}>
                  No drugs added yet. Click "Add Drug" to start.
                </div>
              )}

              {rxList.map((rx, i) => (
                <div key={rx.id}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />}
                  <RxRow
                    rx={rx}
                    patient={patient}
                    onChange={updated => updateRx(rx.id, updated)}
                    onRemove={() => removeRx(rx.id)}
                  />
                </div>
              ))}

              {rxList.length > 0 && (
                <Alert type="info" style={{ marginTop: 16, fontSize: '.78rem' }}>
                  On sign &amp; submit, these prescriptions will be sent directly to the pharmacy Rx queue.
                </Alert>
              )}
            </Card>
          )}

          {/* ── AI TAB ── */}
          {tab === 'ai' && (
            <Card title="AI Clinical Summary" action={
              <button className="btn btn-outline btn-sm" onClick={generateSummary} disabled={aiLoading}>
                <IcCPU width={13} height={13} /> {aiLoading ? 'Generating…' : 'Re-generate'}
              </button>
            }>
              {aiLoading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-400)' }}>
                    <div className="spinner" />
                    Nexus AI is drafting your clinical note…
                  </div>
                </div>
              )}

              {!aiLoading && !aiSummary && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>
                  <IcCPU width={32} height={32} style={{ margin: '0 auto 12px', color: 'var(--primary)', display: 'block' }} />
                  <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 6 }}>AI Summary not yet generated</div>
                  <div style={{ fontSize: '.82rem', marginBottom: 16 }}>Fill in vitals and notes first, then click "AI Summary" to generate a SOAP note.</div>
                  <button className="btn btn-primary btn-sm" onClick={generateSummary}>
                    <IcCPU width={13} height={13} /> Generate Now
                  </button>
                </div>
              )}

              {!aiLoading && aiSummary && (
                <div>
                  <div style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                    fontSize: '.84rem', lineHeight: 1.8, color: 'var(--text-700)',
                    whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', marginBottom: 14,
                  }}>
                    {aiSummary}
                  </div>
                  <Alert type="info" style={{ fontSize: '.78rem' }}>
                    Review and edit the note above if needed before signing. This is an AI draft — clinical judgment takes precedence.
                  </Alert>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
