/**
 * useSSE — Server-Sent Events hook
 *
 * Opens an authenticated EventSource connection to /api/v1/sse.
 * Calls the provided `onMessage` callback with parsed event data.
 *
 * The hook:
 *  - Attaches the JWT from localStorage as a query param (EventSource
 *    does not support custom headers, so the token is passed as ?token=)
 *  - Automatically reconnects with exponential backoff on error
 *  - Closes and cleans up the connection on unmount
 *
 * Usage:
 *   useSSE((event) => {
 *     if (event.type === 'notification') setUnread(n => n + 1);
 *   });
 */
import { useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const MAX_BACKOFF_MS = 30_000;

export function useSSE(onMessage) {
  const esRef      = useRef(null);
  const backoffRef = useRef(1_000);
  const timerRef   = useRef(null);
  const onMsgRef   = useRef(onMessage);

  // Keep callback ref current so callers can use inline functions
  useEffect(() => { onMsgRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const token = localStorage.getItem('nexus_token');
      if (!token) return; // not logged in — don't connect

      const url = `${API_BASE}/api/v1/sse?token=${encodeURIComponent(token)}`;
      const es  = new EventSource(url);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'ping') return; // ignore keep-alives
          onMsgRef.current?.(data);
        } catch { /* ignore malformed events */ }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!destroyed) {
          // Exponential backoff before reconnecting
          timerRef.current = setTimeout(() => {
            backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
            connect();
          }, backoffRef.current);
        }
      };

      es.onopen = () => {
        backoffRef.current = 1_000; // reset backoff on successful open
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(timerRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, []); // only run once on mount
}
