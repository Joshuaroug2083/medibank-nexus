/**
 * AdmitModal — form to admit a patient to a ward bed.
 */
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Modal, useToast } from '../../components';
import { IcSearch, IcPersonAdd } from '../../components/Icons';

export default function AdmitModal({ open, onClose, wards, onSuccess }) {
  const toast = useToast();

  const [patientSearchQ,    setPatientSearchQ]    = useState('');
  const [patientsList,      setPatientsList]      = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [doctorsList,       setDoctorsList]       = useState([]);
  const [bedsList,          setBedsList]          = useState([]);
  const [form, setForm] = useState({
    patientId: '', patientName: '', wardId: '', bedId: '', diagnosis: '', attendingDoctorId: '',
  });

  /* Reset on open */
  useEffect(() => {
    if (!open) return;
    setForm({ patientId: '', patientName: '', wardId: '', bedId: '', diagnosis: '', attendingDoctorId: '' });
    setPatientSearchQ('');
    setPatientsList([]);
    /* Fetch doctors */
    api.get('/api/v1/staff')
      .then(d => setDoctorsList(d.staff?.filter(s => s.role === 'doctor') ?? []))
      .catch(() => {});
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

  /* Fetch available beds when ward changes */
  useEffect(() => {
    if (!form.wardId) { setBedsList([]); return; }
    api.get(`/api/v1/inpatient/wards/${form.wardId}/beds`)
      .then(d => setBedsList(d.beds?.filter(b => b.status === 'available') ?? []))
      .catch(() => setBedsList([]));
  }, [form.wardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.warning('Please select a patient.');
    if (!form.wardId)    return toast.warning('Please select a ward.');
    if (!form.bedId)     return toast.warning('Please select a bed.');

    try {
      await api.post('/api/v1/inpatient/admissions', {
        patientId:          form.patientId,
        bedId:              parseInt(form.bedId),
        wardId:             parseInt(form.wardId),
        diagnosis:          form.diagnosis,
        attendingDoctorId:  form.attendingDoctorId ? parseInt(form.attendingDoctorId) : undefined,
      });
      toast.success('Patient admitted successfully.');
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.error ?? 'Admit failed.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Admit Patient">
      <form onSubmit={handleSubmit}>
        {/* Patient Search */}
        <div className="form-group" style={{ marginBottom: 14, position: 'relative' }}>
          <label className="form-label" htmlFor="admit-patient-search">Search Patient</label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcSearch width={14} height={14} /></div>
            <input
              id="admit-patient-search"
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Type patient name or ID…"
              value={patientSearchQ}
              onChange={e => { setPatientSearchQ(e.target.value); setForm(p => ({ ...p, patientId: '', patientName: '' })); }}
            />
            {searchingPatients && (
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: 14, height: 14 }} />
              </div>
            )}
          </div>
          {patientsList.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
              {patientsList.map(p => (
                <button key={p.id} type="button"
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.84rem', borderBottom: '1px solid var(--border)' }}
                  onClick={() => { setForm(prev => ({ ...prev, patientId: p.id, patientName: `${p.first_name} ${p.last_name}` })); setPatientsList([]); setPatientSearchQ(`${p.first_name} ${p.last_name}`); }}
                >
                  <strong>{p.first_name} {p.last_name}</strong> ({p.id})
                </button>
              ))}
            </div>
          )}
          {form.patientId && (
            <div style={{ marginTop: 6, fontSize: '.76rem', color: 'var(--success)', fontWeight: 700 }}>
              Selected: {form.patientName} ({form.patientId})
            </div>
          )}
        </div>

        {/* Ward Select */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="admit-ward-select">Ward</label>
          <select id="admit-ward-select" className="select" value={form.wardId}
            onChange={e => setForm(p => ({ ...p, wardId: e.target.value, bedId: '' }))}>
            <option value="">Select ward…</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name} ({w.beds?.available ?? 0} free beds)</option>)}
          </select>
        </div>

        {/* Bed Select */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="admit-bed-select">Bed</label>
          <select id="admit-bed-select" className="select" value={form.bedId} disabled={!form.wardId}
            onChange={e => setForm(p => ({ ...p, bedId: e.target.value }))}>
            <option value="">Select bed…</option>
            {bedsList.map(b => <option key={b.id} value={b.id}>Bed {b.bed_number} ({b.bed_type})</option>)}
          </select>
        </div>

        {/* Attending Doctor */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="admit-doctor-select">Attending Doctor</label>
          <select id="admit-doctor-select" className="select" value={form.attendingDoctorId}
            onChange={e => setForm(p => ({ ...p, attendingDoctorId: e.target.value }))}>
            <option value="">Select doctor…</option>
            {doctorsList.map(d => <option key={d.id} value={d.id}>{d.name} ({d.dept})</option>)}
          </select>
        </div>

        {/* Diagnosis */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="admit-diagnosis">Admitting Diagnosis</label>
          <textarea id="admit-diagnosis" className="textarea" placeholder="Reason for admission / primary clinical diagnosis…" rows={3}
            value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary"><IcPersonAdd width={14} height={14} /> Admit Patient</button>
        </div>
      </form>
    </Modal>
  );
}
