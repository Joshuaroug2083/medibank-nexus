/**
 * usePatients — paginated patient list with optional search query.
 * usePatient  — single patient detail + last 5 visits.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/* ── List hook ─────────────────────────────────────────────────────────── */
export function usePatients({ q = '', page = 1, limit = 20 } = {}) {
  const [patients, setPatients] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (q) params.set('q', q);
      const data = await api.get(`/api/v1/patients?${params}`);
      setPatients(data.patients ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message ?? 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [q, page, limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { patients, total, loading, error, refetch };
}

/* ── Single patient hook ───────────────────────────────────────────────── */
export function usePatient(id) {
  const [patient, setPatient] = useState(null);
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/v1/patients/${encodeURIComponent(id)}`);
      setPatient(data.patient ?? null);
      setVisits(data.visits ?? []);
    } catch (err) {
      setError(err.message ?? 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { patient, visits, loading, error, refetch };
}
