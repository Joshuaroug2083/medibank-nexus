/**
 * Lightweight API client — wraps fetch with auth header + base URL.
 * All methods throw an Error with .message from the server on non-2xx responses.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function token() {
  return localStorage.getItem('nexus_token') ?? '';
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token()}`,
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
};
