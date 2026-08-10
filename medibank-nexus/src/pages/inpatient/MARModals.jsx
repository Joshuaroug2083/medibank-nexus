/**
 * MARModals — ScheduleMedModal + AdministerModal for the Medication Administration Record.
 * Exported as named exports so the parent can import only what it needs.
 */
import { useState } from 'react';
import { api } from '../../lib/api';
import { Modal, useToast } from '../../components';

/* ── Schedule Medication ─────────────────────────────────────────────── */
export function ScheduleMedModal({ open, onClose, admission, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ drugName: '', dose: '', route: 'oral', frequency: 'once', scheduledAt: '' });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.drugName.trim())  return toast.warning('Drug name is required.');
    if (!form.dose.trim())      return toast.warning('Dose is required.');
    if (!form.scheduledAt)      return toast.warning('Scheduled date and time are required.');

    try {
      await api.post('/api/v1/inpatient/mar', {
        patientId:   admission.patient_id,
        admissionId: admission.id,
        drugName:    form.drugName.trim(),
        dose:        form.dose.trim(),
        route:       form.route,
        frequency:   form.frequency,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      toast.success('Medication scheduled.');
      setForm({ drugName: '', dose: '', route: 'oral', frequency: 'once', scheduledAt: '' });
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.error ?? 'Failed to schedule.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule Medication">
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="sched-drug-name">Drug Name</label>
          <input id="sched-drug-name" className="input" placeholder="e.g. Paracetamol 500mg, IV Ceftriaxone 1g…" value={form.drugName} onChange={e => set('drugName', e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="sched-dose">Dose</label>
          <input id="sched-dose" className="input" placeholder="e.g. 1g, 500mg, 10ml…" value={form.dose} onChange={e => set('dose', e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="sched-route">Route</label>
          <select id="sched-route" className="select" value={form.route} onChange={e => set('route', e.target.value)}>
            <option value="oral">Oral</option>
            <option value="iv">Intravenous (IV)</option>
            <option value="im">Intramuscular (IM)</option>
            <option value="sc">Subcutaneous (SC)</option>
            <option value="topical">Topical</option>
            <option value="inhaled">Inhaled</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="sched-frequency">Frequency</label>
          <select id="sched-frequency" className="select" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
            <option value="once">Once</option>
            <option value="stat">STAT (Immediately)</option>
            <option value="daily">Once Daily (od)</option>
            <option value="bd">Twice Daily (bd)</option>
            <option value="tds">Three Times Daily (tds)</option>
            <option value="prn">As Needed (prn)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="sched-time">Scheduled Date &amp; Time</label>
          <input id="sched-time" type="datetime-local" className="input" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Schedule Medication</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Administer Medication ───────────────────────────────────────────── */
export function AdministerModal({ open, onClose, marRecord, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ status: 'given', omissionReason: '', notes: '' });
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!marRecord) return;
    try {
      await api.put(`/api/v1/inpatient/mar/${marRecord.id}/administer`, {
        status:          form.status,
        omissionReason:  form.status !== 'given' ? form.omissionReason : undefined,
        notes:           form.notes,
      });
      toast.success('Medication record updated.');
      setForm({ status: 'given', omissionReason: '', notes: '' });
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.error ?? 'Update failed.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Administer ${marRecord?.drug_name ?? 'Medication'}`}>
      <form onSubmit={handleSubmit}>
        {marRecord && (
          <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 'var(--radius)', fontSize: '.81rem', color: 'var(--text-600)', marginBottom: 14 }}>
            <div><strong>Drug:</strong> {marRecord.drug_name}</div>
            <div><strong>Dose:</strong> {marRecord.dose} · <strong>Route:</strong> {marRecord.route}</div>
            <div><strong>Scheduled Time:</strong> {new Date(marRecord.scheduled_at).toLocaleString()}</div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="adm-status">Administration Status</label>
          <select id="adm-status" className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="given">Given / Administered</option>
            <option value="omitted">Omitted</option>
            <option value="refused">Patient Refused</option>
            <option value="held">Held (Clinical Reason)</option>
          </select>
        </div>

        {form.status !== 'given' && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="adm-omission-reason">Reason for Omission / Delay</label>
            <input id="adm-omission-reason" className="input" placeholder="e.g. Patient asleep, NPO, vitals outside parameters…" value={form.omissionReason} onChange={e => set('omissionReason', e.target.value)} />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="adm-notes">Notes / Observations</label>
          <textarea id="adm-notes" className="textarea" placeholder="e.g. Patient tolerated oral medication well, no immediate side effects…" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Confirm Administration</button>
        </div>
      </form>
    </Modal>
  );
}
