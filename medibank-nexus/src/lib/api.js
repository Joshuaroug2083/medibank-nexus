/**
 * Lightweight API client — wraps fetch with auth header + base URL.
 *
 * Features:
 *  - Attaches JWT from localStorage on every request
 *  - Automatic token refresh on 401 (mirrors the logic in AuthContext.apiFetch)
 *  - Throws an Error with .status and .data on non-2xx responses
 *  - All methods return the parsed JSON body (not the raw Response)
 */

const BASE        = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY   = 'nexus_token';
const REFRESH_KEY = 'nexus_refresh';

function getToken()   { return localStorage.getItem(TOKEN_KEY)   ?? ''; }
function getRefresh() { return localStorage.getItem(REFRESH_KEY) ?? ''; }

/** Attempt to refresh the access token. Returns new access token or null. */
async function tryRefresh() {
  const refresh = getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY,   data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request(method, path, body) {
  const makeHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const init = {
    method,
    headers: makeHeaders(getToken()),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(`${BASE}${path}`, init);

  /* ── Auto-refresh on 401 ── */
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: makeHeaders(newToken),
      });
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error ?? data.message ?? `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

async function downloadRequest(path) {
  const makeHeaders = (token) => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const init = {
    method: 'GET',
    headers: makeHeaders(getToken()),
  };

  let res = await fetch(`${BASE}${path}`, init);

  /* ── Auto-refresh on 401 ── */
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: makeHeaders(newToken),
      });
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error ?? data.message ?? `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return res.blob();
}

export const api = {
  get:      (path)        => request('GET',    path),
  post:     (path, body)  => request('POST',   path, body),
  put:      (path, body)  => request('PUT',    path, body),
  patch:    (path, body)  => request('PATCH',  path, body),
  delete:   (path)        => request('DELETE', path),
  download: (path)        => downloadRequest(path),
};
