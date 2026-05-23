/**
 * IntegrationsContext — Manages OAuth connections and AI API key state.
 *
 * Handles:
 *  - Google OAuth2 (Calendar + Drive + Docs all share one Google account connection)
 *  - AI provider API keys (Anthropic, OpenAI, Google AI)
 *  - Persists to localStorage keyed per user
 *  - All key values are masked before display; raw values only leave the browser
 *    when sent to the backend for encrypted storage
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const IntegrationsCtx = createContext(null);

export const useIntegrations = () => {
  const ctx = useContext(IntegrationsCtx);
  if (!ctx) throw new Error('useIntegrations must be used inside <IntegrationsProvider>');
  return ctx;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const DEFAULT_STATE = {
  google: {
    connected:   false,
    email:       null,
    scopes:      [],
    connectedAt: null,
  },
  aiKeys: {
    anthropic: '',
    openai:    '',
    google:    '',
  },
};

function storageKey(userId) { return `nexus_integrations_${userId}`; }

export function IntegrationsProvider({ children }) {
  const { user } = useAuth();
  const [state,   setState]   = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState({});

  /* Load persisted integrations on login */
  useEffect(() => {
    if (!user) { setState(DEFAULT_STATE); return; }
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch { /* ignore corrupt data */ }
  }, [user?.id]);

  const persist = useCallback((next) => {
    if (user) localStorage.setItem(storageKey(user.id), JSON.stringify(next));
  }, [user]);

  /* ── Google OAuth2 ──────────────────────────────────────────── */
  const connectGoogle = useCallback(async () => {
    setLoading(l => ({ ...l, google: true }));
    try {
      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/v1/integrations/google/auth-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();

      /* Open OAuth popup (500×620 centred on screen) */
      const left   = Math.round(window.screenX + (window.outerWidth  - 500) / 2);
      const top    = Math.round(window.screenY + (window.outerHeight - 620) / 2);
      const popup  = window.open(url, 'google_oauth',
        `width=500,height=620,left=${left},top=${top},scrollbars=yes,resizable=yes`);

      return new Promise((resolve) => {
        const handler = (e) => {
          if (e.origin !== window.location.origin) return;
          if (e.data?.type !== 'GOOGLE_OAUTH_SUCCESS')   return;

          window.removeEventListener('message', handler);
          clearTimeout(timeout);
          popup?.close();

          const next = {
            ...state,
            google: {
              connected:   true,
              email:       e.data.email,
              scopes:      e.data.scopes ?? [],
              connectedAt: new Date().toISOString(),
            },
          };
          setState(next);
          persist(next);
          resolve({ success: true, email: e.data.email });
        };

        window.addEventListener('message', handler);

        /* Auto-close if user doesn't complete within 5 minutes */
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          popup?.close();
          resolve({ success: false, reason: 'timeout' });
        }, 300_000);

        /* Poll for popup closed by user */
        const poll = setInterval(() => {
          if (popup?.closed) {
            clearInterval(poll);
            window.removeEventListener('message', handler);
            clearTimeout(timeout);
            resolve({ success: false, reason: 'closed' });
          }
        }, 500);
      });
    } catch (err) {
      return { success: false, reason: err.message };
    } finally {
      setLoading(l => ({ ...l, google: false }));
    }
  }, [state, persist]);

  const disconnectGoogle = useCallback(async () => {
    setLoading(l => ({ ...l, googleDisconnect: true }));
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch(`${API_BASE}/api/v1/integrations/google/disconnect`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* best-effort */ });
    } finally {
      const next = { ...state, google: DEFAULT_STATE.google };
      setState(next);
      persist(next);
      setLoading(l => ({ ...l, googleDisconnect: false }));
    }
  }, [state, persist]);

  /* ── AI Keys ──────────────────────────────────────────────── */
  /**
   * Save an AI provider API key.
   * Sends to backend for AES-256 encrypted storage.
   * Also caches locally (key is not displayed back — only masked).
   */
  const saveAiKey = useCallback(async (provider, key) => {
    setLoading(l => ({ ...l, [`aiKey_${provider}`]: true }));
    try {
      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/v1/integrations/ai-keys`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, key }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to save API key');
      }

      /* Store a flag (not the key itself) so the UI shows "key saved" */
      const next = {
        ...state,
        aiKeys: { ...state.aiKeys, [provider]: key ? '••••saved••••' : '' },
      };
      setState(next);
      persist(next);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(l => ({ ...l, [`aiKey_${provider}`]: false }));
    }
  }, [state, persist]);

  const clearAiKey = useCallback(async (provider) => {
    await saveAiKey(provider, '');
  }, [saveAiKey]);

  /**
   * Test a connection to an AI provider using a stored or provided key.
   */
  const testAiConnection = useCallback(async (provider) => {
    setLoading(l => ({ ...l, [`aiTest_${provider}`]: true }));
    try {
      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/v1/integrations/ai-keys/test`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message ?? data.error };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(l => ({ ...l, [`aiTest_${provider}`]: false }));
    }
  }, []);

  /**
   * Whether a particular AI provider has a saved key.
   */
  const hasAiKey = useCallback((provider) => {
    return !!state.aiKeys[provider];
  }, [state.aiKeys]);

  return (
    <IntegrationsCtx.Provider value={{
      google:           state.google,
      aiKeys:           state.aiKeys,
      loading,
      connectGoogle,
      disconnectGoogle,
      saveAiKey,
      clearAiKey,
      testAiConnection,
      hasAiKey,
    }}>
      {children}
    </IntegrationsCtx.Provider>
  );
}
