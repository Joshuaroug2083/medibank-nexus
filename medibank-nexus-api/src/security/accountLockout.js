/**
 * Account Lockout — Brute-Force Protection
 *
 * Tracks failed login attempts per email in Redis.
 * After MAX_ATTEMPTS failures, the account is locked for LOCKOUT_MINUTES.
 *
 * Two-dimensional lockout:
 *   1. Per-email lockout   — protects a specific account from being hammered
 *   2. Per-IP lockout      — protects against distributed attacks across accounts
 *
 * Redis keys:
 *   lockout:email:<email>      → failed attempt count (expires after window)
 *   lockout:locked:<email>     → "1" while account is locked (expires after lockout duration)
 *   lockout:ip:<ip>            → failed attempt count per IP
 */
import { getRedis } from './redisClient.js';

const MAX_ATTEMPTS      = parseInt(process.env.MAX_LOGIN_ATTEMPTS      ?? '5');
const LOCKOUT_MINUTES   = parseInt(process.env.LOCKOUT_DURATION_MINUTES ?? '15');
const IP_MAX_ATTEMPTS   = 20;      // more lenient for IP — covers shared networks
const ATTEMPT_WINDOW    = 15 * 60; // 15 minute rolling window (seconds)
const LOCKOUT_TTL       = LOCKOUT_MINUTES * 60;

/* ── Record a failed login attempt ───────────────────────────── */
export async function recordFailedAttempt(email, ip) {
  const redis      = await getRedis();
  const emailKey   = `lockout:email:${email.toLowerCase()}`;
  const ipKey      = `lockout:ip:${ip}`;

  /* Increment counters; set TTL on first attempt */
  const [emailCount, ipCount] = await Promise.all([
    redis.incr(emailKey),
    redis.incr(ipKey),
  ]);

  /* Set expiry on first increment */
  if (emailCount === 1) await redis.expire(emailKey, ATTEMPT_WINDOW);
  if (ipCount    === 1) await redis.expire(ipKey,    ATTEMPT_WINDOW);

  /* Lock the account after too many per-email failures */
  if (emailCount >= MAX_ATTEMPTS) {
    await redis.setex(`lockout:locked:${email.toLowerCase()}`, LOCKOUT_TTL, '1');
  }

  return { emailCount, ipCount };
}

/* ── Clear failed attempts after a successful login ─────────── */
export async function clearAttempts(email, ip) {
  const redis = await getRedis();
  await Promise.all([
    redis.del(`lockout:email:${email.toLowerCase()}`),
    redis.del(`lockout:ip:${ip}`),
    /* Do NOT delete the locked key here — let it expire naturally
       or use unlockAccount() for admin override. */
  ]);
}

/* ── Check if an account is currently locked ────────────────── */
export async function isLocked(email) {
  const redis  = await getRedis();
  const result = await redis.exists(`lockout:locked:${email.toLowerCase()}`);
  return result === 1;
}

/* ── Get remaining lockout time in seconds ────────────────────── */
export async function getLockoutTTL(email) {
  const redis = await getRedis();
  const ttl   = await redis.ttl(`lockout:locked:${email.toLowerCase()}`);
  return ttl > 0 ? ttl : 0;
}

/* ── Get current failed attempt count ───────────────────────── */
export async function getAttemptCount(email) {
  const redis = await getRedis();
  const val   = await redis.get(`lockout:email:${email.toLowerCase()}`);
  return val ? parseInt(val) : 0;
}

/* ── Admin: unlock an account early ─────────────────────────── */
export async function unlockAccount(email) {
  const redis = await getRedis();
  await Promise.all([
    redis.del(`lockout:locked:${email.toLowerCase()}`),
    redis.del(`lockout:email:${email.toLowerCase()}`),
  ]);
}

/* ── Express middleware: check lockout before processing login ── */
export async function lockoutGuard(req, res, next) {
  const email = (req.body?.email ?? '').trim().toLowerCase();
  if (!email) return next();   // let the route handler reject the missing email

  try {
    const locked = await isLocked(email);
    if (locked) {
      const remaining = await getLockoutTTL(email);
      const minutes   = Math.ceil(remaining / 60);
      return res.status(429).json({
        error:   'Account temporarily locked',
        message: `Too many failed login attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        retryAfter: remaining,
      });
    }
    next();
  } catch (err) {
    /* Redis failure must not block login — fail open in dev, closed in prod */
    if (process.env.NODE_ENV === 'production') {
      console.error('[LOCKOUT] Redis error during lockout check:', err.message);
      return res.status(503).json({ error: 'Security service temporarily unavailable' });
    }
    next();
  }
}
