import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../lib/api';

describe('Lightweight API Client (api.js)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches Bearer token to headers when token exists', async () => {
    localStorage.setItem('nexus_token', 'test-token-123');

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const data = await api.get('/api/v1/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-123',
        }),
      })
    );
    expect(data).toEqual({ success: true });
  });

  it('throws an error with status and data on non-2xx response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request description' }),
    });

    await expect(api.get('/api/v1/bad')).rejects.toThrow('Bad request description');

    try {
      await api.get('/api/v1/bad');
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.data).toEqual({ error: 'Bad request description' });
    }
  });

  it('attempts to refresh token on 401 and retries the request', async () => {
    localStorage.setItem('nexus_token', 'expired-token');
    localStorage.setItem('nexus_refresh', 'refresh-token-xyz');

    // First call returns 401
    // Second call is token refresh POST /api/v1/auth/refresh returning 200
    // Third call is the original request retrying and returning 200
    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'brand-new-token',
          refreshToken: 'brand-new-refresh',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Retried successfully' }),
      });

    const data = await api.get('/api/v1/protected');

    // Assert token refresh POST was called
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-token-xyz' }),
      })
    );

    // Assert final retry was called with the new token
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/protected'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer brand-new-token',
        }),
      })
    );

    // Caches are updated
    expect(localStorage.getItem('nexus_token')).toBe('brand-new-token');
    expect(localStorage.getItem('nexus_refresh')).toBe('brand-new-refresh');

    expect(data).toEqual({ message: 'Retried successfully' });
  });
});
