/**
 * useVisits — paginated consultation history for a patient.
 * useVisit  — single visit / consultation detail.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/* ── Visit list hook ───────────────────────────────────────────────────── */
export function useVisits({ patientId, page = 1, limit = 10 } = {}) {
  const [visits,  setVisits]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ patientId, page, limit });
      const data   = await api.get(`/api/v1/visits?${params}`);
      setVisits(data.visits ?? []);
      setTotal(data.total  ?? 0);
    } catch (err) {
      setError(err.message ?? 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [patientId, page, limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { visits, total, loading, error, refetch };
}

/* ── Single visit hook ─────────────────────────────────────────────────── */
export function useVisit(id) {
  const [visit,   setVisit]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/v1/visits/${encodeURIComponent(id)}`);
      setVisit(data.visit ?? data ?? null);
    } catch (err) {
      setError(err.message ?? 'Failed to load visit');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { visit, loading, error, refetch };
}
