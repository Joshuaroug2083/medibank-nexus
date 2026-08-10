/**
 * NursingNoteModal — add a nursing note with optional vitals for a patient.
 */
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal, useToast } from '../../components';
import { IcSearch } from '../../components/Icons';

const EMPTY_VITALS = { bpSys: '', bpDia: '', pulse: '', temp: '', spo2: '', rr: '' };

export default function NursingNoteModal({ open, onClose, admissions, onSuccess }) {
  const toast = useToast();

  const [patientSearchQ,    setPatientSearchQ]    = useState('');
  const [patientsList,      setPatientsList]      = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [form, setForm] = useState({
    patientId: '', patientName: '', admissionId: '',
    noteType: 'general', content: '', vitals: { ...EMPTY_VITALS },
  });

  /* Reset on open */
  useEffect(() => {
    if (!open) return;
    setForm({ patientId: '', patientName: '', admissionId: '', noteType: 'general', content: '', vitals: { ...EMPTY_VITALS } });
    setPatientSearchQ('');
    setPatientsList([]);
  }, [open]);

  /* Debounced patient search */
  useEffect(() => {
    if (patientSearchQ.trim().length < 2) { setPatientsList([]); return; }
    setSearchingPatients(true);
    const t = setTimeout(async () => {
      try {
        const d = await api.get(`/api/v1/patients?q=${encodeURIComponent(patientSearchQ)}&limit=10`);
        setPatientsList(d.patients ?? []);
      } catch { setPatientsList([]); }
      finally { setSearchingPatients(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearchQ]);

  const setVital = (key, val) => setForm(p => ({ ...p, vitals: { ...p.vitals, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId)       return toast.warning('Please select a patient.');
    if (!form.content.trim())  return toast.warning('Note content is required.');

    const v = form.vitals;
    const hasVitals = Object.values(v).some(Boolean);
    const vitalsObj = hasVitals
      ? { bp: v.bpSys && v.bpDia ? `${v.bpSys}/${v.bpDia}` : undefined, pulse: v.pulse || undefined, temp: v.temp || undefined, spo2: v.spo2 || undefined, rr: v.rr || undefined }
      : null;

    try {
      await api.post('/api/v1/inpatient/nursing-notes', {
        patientId:   form.patientId,
        admissionId: form.admissionId ? parseInt(form.admissionId) : undefined,
        noteType:    form.noteType,
        content:     form.content,
        vitals:      vitalsObj,
      });
      toast.success('Nursing note added.');
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.error ?? 'Failed to add note.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Nursing Note" size="lg">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            {/* Patient Search */}
            <div className="form-group" style={{ marginBottom: 14, position: 'relative' }}>
              <label className="form-label" htmlFor="note-patient-search">Patient</label>
              <div className="input-wrap">
                <div className="input-icon-left"><IcSearch width={14} height={14} /></div>
                <input id="note-patient-search" className="input" style={{ paddingLeft: 36 }}
                  placeholder="Type patient name or ID…"
                  value={patientSearchQ}
                  onChange={e => { setPatientSearchQ(e.target.value); setForm(p => ({ ...p, patientId: '', patientName: '', admissionId: '' })); }}
                />
                {searchingPatients && (
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                  </div>
                )}
              </div>
              {patientsList.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
                  {patientsList.map(p => {
                    const matchingAdm = admissions.find(a => String(a.patient_id) === String(p.id));
                    return (
                      <button key={p.id} type="button"
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.84rem', borderBottom: '1px solid var(--border)' }}
                        onClick={() => {
                          setForm(prev => ({ ...prev, patientId: p.id, patientName: `${p.first_name} ${p.last_name}`, admissionId: matchingAdm ? matchingAdm.id : '' }));
                          setPatientsList([]);
                          setPatientSearchQ(`${p.first_name} ${p.last_name}`);
                        }}
                      >
                        <strong>{p.first_name} {p.last_name}</strong> ({p.id}) {matchingAdm && '· Admitted'}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.patientId && (
                <div style={{ marginTop: 6, fontSize: '.76rem', color: 'var(--success)', fontWeight: 700 }}>
                  {form.patientName} ({form.patientId}) {form.admissionId ? '· Admission linked' : '· Outpatient Note'}
                </div>
              )}
            </div>

            {/* Note Type */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="note-type-select">Note Type</label>
              <select id="note-type-select" className="select" value={form.noteType} onChange={e => setForm(p => ({ ...p, noteType: e.target.value }))}>
                <option value="general">General Note</option>
                <option value="vitals">Vitals Record</option>
                <option value="triage">Triage Note</option>
                <option value="progress">Progress Note</option>
                <option value="shift_handover">Shift Handover</option>
              </select>
            </div>

            {/* Content */}
            <div className="form-group">
              <label className="form-label" htmlFor="note-content">Note Content</label>
              <textarea id="note-content" className="textarea"
                placeholder="Record nursing interventions, patient status, complaints, or observations…"
                rows={6} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            </div>
          </div>

          {/* Vitals (Optional) */}
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)', marginBottom: 14 }}>Vital Signs (Optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['vital-bp-sys',  'Systolic BP',      'mmHg', 'number', 'bpSys',  null],
                ['vital-bp-dia',  'Diastolic BP',     'mmHg', 'number', 'bpDia',  null],
                ['vital-pulse',   'Pulse Rate',       'bpm',  'number', 'pulse',  null],
                ['vital-temp',    'Temperature',      '°C',   'number', 'temp',   '0.1'],
                ['vital-spo2',    'SpO₂',             '%',    'number', 'spo2',   null],
                ['vital-rr',      'Respiration Rate', '/min', 'number', 'rr',     null],
              ].map(([id, label, ph, type, key, step]) => (
                <div key={id} className="form-group">
                  <label className="form-label" htmlFor={id}>{label}</label>
                  <input id={id} className="input" placeholder={ph} type={type} step={step ?? undefined}
                    value={form.vitals[key]} onChange={e => setVital(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Note</button>
        </div>
      </form>
    </Modal>
  );
}
