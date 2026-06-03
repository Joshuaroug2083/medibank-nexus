import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockUsers';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/* ── Context ── */
const AuthContext = createContext(null);

/* ── Hook ── */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

/* ── Token storage ── */
const TOKEN_KEY   = 'nexus_token';
const REFRESH_KEY = 'nexus_refresh';
const USER_KEY    = 'nexus_user';

function storeSession(accessToken, refreshToken, user) {
  localStorage.setItem(TOKEN_KEY,   accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/* ── API helper: authenticated fetch ── */
export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const res   = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  /* Auto-refresh on 401 */
  if (res.status === 401) {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      const rRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (rRes.ok) {
        const data = await rRes.json();
        localStorage.setItem(TOKEN_KEY,   data.accessToken);
        localStorage.setItem(REFRESH_KEY, data.refreshToken);
        /* Retry original request */
        return fetch(`${API_BASE}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.accessToken}`,
            ...options.headers,
          },
        });
      }
    }
  }

  return res;
}

/* ── Provider ── */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [loginError, setLoginError] = useState('');
  const [loading,    setLoading]    = useState(false);

  /* Keep sessionStorage in sync */
  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else      clearSession();
  }, [user]);

  /**
   * Real JWT login — calls POST /api/v1/auth/login
   * Falls back to mock login if the API is unavailable (dev convenience).
   */
  const login = async (email, password) => {
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (res.ok) {
        const data = await res.json();
        const u = {
          id:         data.user.id,
          name:       data.user.name,
          email:      data.user.email,
          role:       data.user.role,
          dept:       data.user.dept ?? '',
          initials:   data.user.initials ?? '',
          hospitalId: data.hospital.id,
          hospital:   data.hospital,
        };
        storeSession(data.accessToken, data.refreshToken, u);
        setUser(u);
        setLoading(false);
        return { success: true, hospitalId: data.hospital.id };
      }

      const err = await res.json();

      /* Check for 2FA required */
      if (res.status === 206 && err.requires2fa) {
        setLoading(false);
        return { success: false, requires2fa: true, tempToken: err.tempToken };
      }

      setLoginError(err.error ?? 'Incorrect email or password');
      setLoading(false);
      return { success: false };

    } catch {
      /* Network error — fall back to mock login in development */
      console.warn('[Auth] API unreachable — using mock login (dev mode)');
      return _mockLogin(email, password);
    }
  };

  /** Verify TOTP code after 2FA challenge */
  const verify2FA = async (tempToken, code) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/v1/auth/verify-2fa`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: data.error };
      }
      const u = {
        id:         data.user.id,
        name:       data.user.name,
        email:      data.user.email,
        role:       data.user.role,
        dept:       data.user.dept ?? '',
        initials:   data.user.initials ?? '',
        hospitalId: data.hospital.id,
        hospital:   data.hospital,
      };
      storeSession(data.accessToken, data.refreshToken, u);
      setUser(u);
      setLoading(false);
      return { success: true, hospitalId: data.hospital.id };
    } catch {
      setLoading(false);
      return { success: false, error: 'Network error' };
    }
  };

  /** Mock fallback for development when API is down */
  const _mockLogin = async (email, password) => {
    await new Promise(r => setTimeout(r, 600));
    const found = MOCK_USERS.find(
      u => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (found) {
      const { password: _pw, ...safeUser } = found;
      setUser(safeUser);
      setLoading(false);
      return { success: true, hospitalId: found.hospitalId };
    }
    setLoginError('Incorrect email or password. Try the quick-login buttons above.');
    setLoading(false);
    return { success: false };
  };

  /** Quick-fill + immediate login for demo mode (always mock) */
  const quickLogin = async (mockUser) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const { password: _pw, ...safeUser } = mockUser;
    setUser(safeUser);
    setLoading(false);
    return { hospitalId: mockUser.hospitalId };
  };

  const logout = async () => {
    /* Attempt to blacklist the token server-side */
    try {
      const token = getAccessToken();
      if (token) {
        await fetch(`${API_BASE}/api/v1/auth/logout`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, login, verify2FA, quickLogin, logout,
      loading, loginError, setLoginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
