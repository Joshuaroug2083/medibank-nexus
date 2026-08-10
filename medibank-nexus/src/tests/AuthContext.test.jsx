import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestComponent() {
  const { user, login, logout, loginError } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="error">{loginError || 'none'}</div>
      <button onClick={() => login('test@lgh.gov.ng', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates state and session on successful login', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'fake-access',
        refreshToken: 'fake-refresh',
        user: { id: 'u1', name: 'Dr. Obi', email: 'test@lgh.gov.ng', role: 'admin' },
        hospital: { id: 'h1', name: 'Lagos Hospital' }
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('none');

    const loginBtn = screen.getByText('Login');
    await act(async () => {
      loginBtn.click();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@lgh.gov.ng', password: 'password123' })
      })
    );

    expect(screen.getByTestId('user').textContent).toBe('Dr. Obi');
    expect(localStorage.getItem('nexus_token')).toBe('fake-access');
    expect(localStorage.getItem('nexus_refresh')).toBe('fake-refresh');
    expect(sessionStorage.getItem('nexus_user')).toContain('Dr. Obi');
  });

  it('clears state on logout', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    // Seed session
    localStorage.setItem('nexus_token', 'fake-access');
    localStorage.setItem('nexus_refresh', 'fake-refresh');
    sessionStorage.setItem('nexus_user', JSON.stringify({ name: 'Dr. Obi' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('Dr. Obi');

    const logoutBtn = screen.getByText('Logout');
    await act(async () => {
      logoutBtn.click();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/logout'),
      expect.objectContaining({ method: 'POST' })
    );

    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(localStorage.getItem('nexus_token')).toBeNull();
    expect(localStorage.getItem('nexus_refresh')).toBeNull();
    expect(sessionStorage.getItem('nexus_user')).toBeNull();
  });
});
