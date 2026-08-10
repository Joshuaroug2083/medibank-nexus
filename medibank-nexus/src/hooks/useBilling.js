/**
 * useBilling    — paginated invoice list with optional filters.
 * useBillingSummary — revenue summary widget data.
 * useInvoice    — single invoice detail.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/* ── Invoice list hook ─────────────────────────────────────────────────── */
export function useBilling({ page = 1, limit = 20, status, patientId } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (status)    params.set('status',    status);
      if (patientId) params.set('patientId', patientId);
      const data = await api.get(`/api/v1/billing/invoices?${params}`);
      setInvoices(data.invoices ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, patientId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { invoices, total, loading, error, refetch };
}

/* ── Revenue summary hook ──────────────────────────────────────────────── */
export function useBillingSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/api/v1/billing/summary')
      .then(data  => setSummary(data))
      .catch(err  => setError(err.message ?? 'Failed to load billing summary'))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error };
}

/* ── Single invoice hook ───────────────────────────────────────────────── */
export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/v1/billing/invoices/${encodeURIComponent(id)}`);
      setInvoice(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { invoice, loading, error, refetch };
}
