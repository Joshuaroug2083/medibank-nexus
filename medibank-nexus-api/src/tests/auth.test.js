/**
 * MediBank Nexus API — Auth Route Tests
 *
 * Covers:
 *   POST /api/v1/auth/login       — valid login, wrong password, missing fields
 *   POST /api/v1/auth/logout      — requires auth, blacklists token
 *   GET  /api/v1/auth/me          — returns user from valid JWT
 *   Middleware: authenticate      — rejects missing / expired / blacklisted tokens
 *
 * Strategy:
 *   - Spin up the Express app in-process using supertest (no real network)
 *   - Mock the DB (knex) and Redis so tests run without infrastructure
 *   - Use real JWT signing so token validation logic is exercised
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import jwt     from 'jsonwebtoken';
import bcrypt  from 'bcrypt';

/* ── Environment bootstrap (must happen before app import) ─────────── */
process.env.JWT_SECRET      = 'test-secret-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'refresh-secret-64xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_EXPIRES_IN  = '1h';
process.env.ENCRYPTION_KEY  = 'a'.repeat(64); // 32 bytes expressed as 64 hex chars
process.env.NODE_ENV        = 'test';

/* ── Mock Redis (token blacklist) ──────────────────────────────────── */
vi.mock('../security/redisClient.js', () => ({
  getRedis: vi.fn().mockResolvedValue({
    get:  vi.fn().mockResolvedValue(null),  // nothing is blacklisted by default
    set:  vi.fn().mockResolvedValue('OK'),
    del:  vi.fn().mockResolvedValue(1),
  }),
  default: {
    get:  vi.fn().mockResolvedValue(null),
    set:  vi.fn().mockResolvedValue('OK'),
    del:  vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../security/tokenBlacklist.js', () => ({
  isBlacklisted:        vi.fn().mockResolvedValue(false),
  blacklistToken:       vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens:  vi.fn().mockResolvedValue(undefined),
  getUserRevocationTime: vi.fn().mockResolvedValue(null),
}));

vi.mock('../security/accountLockout.js', () => ({
  lockoutGuard:        vi.fn((_req, _res, next) => next()),
  recordFailedAttempt: vi.fn().mockResolvedValue(undefined),
  clearAttempts:       vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../security/rateLimiter.js', () => ({
  generalLimiter:    vi.fn((_req, _res, next) => next()),
  authLimiter:       vi.fn((_req, _res, next) => next()),
  strictLimiter:     vi.fn((_req, _res, next) => next()),
  attachRedisStores: vi.fn().mockResolvedValue(undefined),
}));

/* ── Mock audit middleware (fire-and-forget, don't need to test here) ─ */
vi.mock('../middleware/audit.js', () => ({
  audit: vi.fn(),
}));

/* ── Mock DB (knex) ────────────────────────────────────────────────── */
const hoisted = vi.hoisted(() => {
  const MOCK_PASSWORD_HASH = '$2b$10$1u1WSIH9ZOZl4.Mjm.Buc.c9O7WOGG8Jiq8gifpktVDtksdwBINxi'; // Password123!
  const MOCK_USER = {
    id:          1,
    email:       'test@hospital.ng',
    password:    MOCK_PASSWORD_HASH,
    name:        'Test User',
    role:        'doctor',
    hospital_id: 1,
    initials:    'TU',
    dept:        'General',
    active:      true,
    mfa_enabled: false,
    status:      'active',
  };

  const MOCK_HOSPITAL = {
    id:         1,
    name:       'Test Hospital',
    short_name: 'TH',
    type:       'private',
    tier:       'standard',
    city:       'Lagos',
    state:      'Lagos',
    status:     'active',
    primaryColor: '#1a73e8',
    features:   {},
  };

  const makeChain = (firstRow) => {
    const chain = {
      where:       () => chain,
      whereNot:    () => chain,
      orWhereNull: () => chain,
      first:       () => Promise.resolve(firstRow),
      insert:      () => Promise.resolve([{ id: 1 }]),
      update:      () => Promise.resolve(1),
      returning:   () => chain,
      select:      () => chain,
      limit:       () => chain,
      offset:      () => chain,
      orderBy:     () => chain,
      count:       () => chain,
      clone:       () => chain,
      delete:      () => Promise.resolve(1),
    };
    return chain;
  };

  const mockDb = (table) => {
    if (table === 'users')        return makeChain(MOCK_USER);
    if (table === 'hospitals')    return makeChain(MOCK_HOSPITAL);
    if (table === 'totp_secrets') return makeChain(null);     // no 2FA configured
    if (table === 'refresh_tokens') return makeChain(null);
    return makeChain(null);
  };
  mockDb.raw = () => Promise.resolve([]);
  mockDb.fn  = { now: () => new Date().toISOString() };

  return { mockDb, MOCK_USER, MOCK_HOSPITAL };
});

vi.mock('../db.js', () => {
  const wrapper = (table) => hoisted.mockDb(table);
  wrapper.raw = hoisted.mockDb.raw;
  wrapper.fn  = hoisted.mockDb.fn;
  return { default: wrapper };
});

const { MOCK_USER, MOCK_HOSPITAL } = hoisted;

/* ── Import app after all mocks are set up ─────────────────────────── */
const { default: express }  = await import('express');
const { default: authRoutes } = await import('../routes/auth.js');
const { default: authenticate } = await import('../middleware/auth.js');

/** Build a minimal Express app wired to just the auth routes for testing */
function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);

  /* A simple protected endpoint to test the authenticate middleware */
  app.get('/api/v1/me-test', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  // Global error handler to catch and output stack traces
  app.use((err, req, res, next) => {
    console.error('TEST ERROR:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  return app;
}

const app = buildTestApp();

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════ */
function makeToken(overrides = {}) {
  return jwt.sign(
    { jti: 'test-jti', id: 1, email: MOCK_USER.email, role: 'doctor', hospitalId: 1, ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TEST SUITES
══════════════════════════════════════════════════════════════════════ */

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: MOCK_USER.email, password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(MOCK_USER.email);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: MOCK_USER.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('fields');
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: MOCK_USER.email });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('fields');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('fields');
  });
});

describe('GET /api/v1/me-test (authenticate middleware)', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/me-test');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/me-test')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('returns 401 with expired token', async () => {
    const expiredToken = jwt.sign(
      { jti: 'exp-jti', id: 1, email: MOCK_USER.email, role: 'doctor', hospitalId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '0s' },
    );
    // Give it a moment to expire
    await new Promise(r => setTimeout(r, 50));
    const res = await request(app)
      .get('/api/v1/me-test')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('returns 200 with valid Bearer token', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/me-test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(MOCK_USER.email);
  });

  it('returns 401 when token is blacklisted', async () => {
    const { isBlacklisted } = await import('../security/tokenBlacklist.js');
    isBlacklisted.mockResolvedValueOnce(true);

    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/me-test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });

  it('accepts token via ?token= query param (SSE fallback)', async () => {
    const token = makeToken();
    const res = await request(app)
      .get(`/api/v1/me-test?token=${encodeURIComponent(token)}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(MOCK_USER.email);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 401 when called without a token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('returns 200 and blacklists the token on valid logout', async () => {
    const { blacklistToken } = await import('../security/tokenBlacklist.js');
    const token = makeToken();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(blacklistToken).toHaveBeenCalled();
  });
});
