/**
 * useInpatientData — custom hook that owns all data-fetching for InpatientPage.
 * Separating data loading from rendering reduces InpatientPage's cognitive load
 * and makes each concern independently testable.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

/* ── Mock data fallback ──────────────────────── */
export const MOCK_WARDS = [
  { id: 1, name: 'General Ward A', ward_type: 'general',  beds: { total: 20, available: 7, occupied: 13 } },
  { id: 2, name: 'ICU',            ward_type: 'icu',       beds: { total: 6,  available: 2, occupied: 4  } },
  { id: 3, name: 'Maternity',      ward_type: 'maternity', beds: { total: 12, available: 5, occupied: 7  } },
  { id: 4, name: 'Paediatric',     ward_type: 'paediatric',beds: { total: 10, available: 4, occupied: 6  } },
];

export const MOCK_ADMISSIONS = [
  { id: 1, patient_id: 'PT-2026-0001', patient_name: 'Amaka Obi',    ward_id: 1, ward_name: 'General Ward A', bed_id: 1, bed_number: '7', doctor_name: 'Dr. Adebayo', admitted_at: new Date(Date.now()-2*86400000).toISOString(), diagnosis: 'Malaria with complications', status: 'admitted' },
  { id: 2, patient_id: 'PT-2026-0002', patient_name: 'Emeka Chukwu', ward_id: 2, ward_name: 'ICU',            bed_id: 2, bed_number: '2', doctor_name: 'Dr. Ibrahim',  admitted_at: new Date(Date.now()-86400000).toISOString(),   diagnosis: 'Septicaemia',               status: 'admitted' },
  { id: 3, patient_id: 'PT-2026-0003', patient_name: 'Chioma Nwosu', ward_id: 3, ward_name: 'Maternity',      bed_id: 3, bed_number: '5', doctor_name: 'Dr. Adebayo', admitted_at: new Date(Date.now()-3600000).toISOString(),    diagnosis: 'Ante-partum care',          status: 'admitted' },
];

export function useInpatientData() {
  const [wards,        setWards]        = useState([]);
  const [admissions,   setAdmissions]   = useState([]);
  const [nursingNotes, setNursingNotes] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wData, aData, nData] = await Promise.all([
        api.get('/api/v1/inpatient/wards'),
        api.get('/api/v1/inpatient/admissions?status=admitted'),
        api.get('/api/v1/inpatient/nursing-notes'),
      ]);
      setWards(wData.wards        ?? []);
      setAdmissions(aData.admissions ?? []);
      setNursingNotes(nData.notes    ?? []);
    } catch (err) {
      console.warn('[Inpatient] API unavailable, using mock data:', err.message);
      setError(err.message);
      setWards(MOCK_WARDS);
      setAdmissions(MOCK_ADMISSIONS);
      setNursingNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return { wards, admissions, nursingNotes, loading, error, reload: loadData };
}

export function useMarRecords() {
  const [marRecords,          setMarRecords]          = useState([]);
  const [loadingMar,          setLoadingMar]          = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');

  const loadMarRecords = useCallback(async (admissionId) => {
    if (!admissionId) { setMarRecords([]); return; }
    setLoadingMar(true);
    try {
      const data = await api.get(`/api/v1/inpatient/mar?admissionId=${admissionId}`);
      setMarRecords(data.records ?? []);
    } catch (err) {
      console.error('[MAR] Failed to load:', err);
    } finally {
      setLoadingMar(false);
    }
  }, []);

  useEffect(() => { loadMarRecords(selectedAdmissionId); }, [selectedAdmissionId, loadMarRecords]);

  return {
    marRecords, loadingMar,
    selectedAdmissionId, setSelectedAdmissionId,
    reloadMar: () => loadMarRecords(selectedAdmissionId),
  };
}
