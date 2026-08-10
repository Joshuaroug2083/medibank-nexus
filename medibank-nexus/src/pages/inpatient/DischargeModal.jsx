/**
 * DischargeModal — confirm and document patient discharge.
 */
import { useState } from 'react';
import { api } from '../../lib/api';
import { Modal, useToast } from '../../components';

export default function DischargeModal({ open, onClose, admission, onSuccess }) {
  const toast = useToast();
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!admission) return;
    try {
      await api.post(`/api/v1/inpatient/admissions/${admission.id}/discharge`, { dischargeNotes: notes });
      toast.success('Patient discharged successfully.');
      setNotes('');
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.error ?? 'Discharge failed.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Discharge ${admission?.patient_name ?? 'Patient'}`}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: '.84rem', color: 'var(--text-500)', marginBottom: 14 }}>
          Please document the discharge instructions and details before releasing the patient.
        </p>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="discharge-notes">Discharge Notes &amp; Follow-up Instructions</label>
          <textarea
            id="discharge-notes"
            className="textarea"
            placeholder="e.g. Prescribed home medications. Follow up in outpatient clinic in 1 week…"
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-danger">Confirm Discharge</button>
        </div>
      </form>
    </Modal>
  );
}
