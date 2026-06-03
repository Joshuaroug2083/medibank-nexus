/**
 * Rate Limiters
 *
 * Three tiers of protection:
 *
 * 1. generalLimiter   — All API routes:   100 req / 15 min per IP
 * 2. authLimiter      — Login / register:  10 req / 15 min per IP
 *                       (extra-tight to stop brute-force credential stuffing)
 * 3. strictLimiter    — Sensitive ops:      3 req / 60 min per IP
 *                       (password reset, 2FA, hospital onboarding)
 * 4. aiLimiter        — AI proxy:          30 req / 60 min per user
 *                       (cost protection + abuse prevention)
 */
import rateLimit         from 'express-rate-limit';
import { RedisStore }    from 'rate-limit-redis';
import { getRedis }      from './redisClient.js';

/* ── build a store (Redis if available, memory otherwise) ─────── */
async function makeStore(prefix) {
  try {
    const redis = await getRedis();
    /* RedisStore requires a sendCommand function */
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    });
  } catch {
    /* Falls back to in-memory store built into express-rate-limit */
    return undefined;
  }
}

/* ── shared response for all limiters ────────────────────────── */
const handler = (req, res) => {
  res.status(429).json({
    error:      'Too many requests',
    message:    'You have made too many requests in a short period. Please wait and try again.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/* ── 1. General limiter ───────────────────────────────────────── */
export const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,                         // 15 min
  max:              parseInt(process.env.RATE_LIMIT_GENERAL ?? '100'),
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  keyGenerator:     (req) => req.ip,
  handler,
  skip: (req) => req.path === '/health',                     // never limit health check
});

/* ── 2. Auth limiter (login / token refresh) ─────────────────── */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              parseInt(process.env.RATE_LIMIT_AUTH ?? '10'),
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  /* Key by IP + email (if present) to stop distributed attacks */
  keyGenerator:     (req) => {
    const email = (req.body?.email ?? '').toLowerCase().trim();
    return email ? `${req.ip}:${email}` : req.ip;
  },
  handler,
});

/* ── 3. Strict limiter (sensitive operations) ────────────────── */
export const strictLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,                          // 1 hour
  max:             3,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  keyGenerator:    (req) => req.ip,
  handler,
});

/* ── 4. AI limiter (per authenticated user) ──────────────────── */
export const aiLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             30,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  /* Key by user ID once authenticated, else by IP */
  keyGenerator:    (req) => req.user?.id ?? req.ip,
  handler,
});

/**
 * Attach Redis stores to all limiters.
 * Call this once at startup after Redis is ready.
 */
export async function attachRedisStores() {
  const [generalStore, authStore, strictStore, aiStore] = await Promise.all([
    makeStore('rl:general:'),
    makeStore('rl:auth:'),
    makeStore('rl:strict:'),
    makeStore('rl:ai:'),
  ]);

  if (generalStore) generalLimiter.store = generalStore;
  if (authStore)    authLimiter.store    = authStore;
  if (strictStore)  strictLimiter.store  = strictStore;
  if (aiStore)      aiLimiter.store      = aiStore;
}
