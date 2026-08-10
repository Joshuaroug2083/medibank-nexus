/**
 * useAnalytics — fetches dashboard analytics summary from the API.
 *
 * Returns revenue, patient counts, appointment trends, and top diagnoses.
 * Cached for the lifetime of the component; call refetch() to force refresh.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/api/v1/analytics/summary');
      setData(result);
    } catch (err) {
      setError(err.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
