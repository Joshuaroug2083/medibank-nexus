/**
 * JWT Authentication Middleware
 *
 * Verification pipeline per request:
 *   1. Extract Bearer token from Authorization header
 *   2. Verify JWT signature and expiry
 *   3. Check token JTI against Redis blacklist (logout enforcement)
 *   4. Check user-level revocation timestamp (force-logout-all)
 *   5. Attach req.user and req.hospitalId for downstream middleware
 */
import jwt     from 'jsonwebtoken';
import { isBlacklisted, getUserRevocationTime } from '../security/tokenBlacklist.js';

export default async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      hint:  'Provide a valid Bearer token in the Authorization header',
    });
  }

  const token = header.split(' ')[1];

  /* ── 1. Verify signature + expiry ─────────────────────────── */
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired. Please sign in again.'
      : 'Invalid token. Please sign in again.';
    return res.status(401).json({ error: message });
  }

  /* ── 2. Check JTI blacklist (logout revocation) ────────────── */
  if (payload.jti) {
    try {
      const revoked = await isBlacklisted(payload.jti);
      if (revoked) {
        return res.status(401).json({
          error: 'Token has been revoked. Please sign in again.',
        });
      }
    } catch (err) {
      /* Redis failure: fail closed in production, open in dev */
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] Redis blacklist check failed:', err.message);
        return res.status(503).json({ error: 'Security service temporarily unavailable' });
      }
      /* In development, log the warning and continue */
      console.warn('[AUTH] Blacklist check skipped (Redis unavailable)');
    }
  }

  /* ── 3. Check per-user revocation timestamp ─────────────────── */
  /* Protects against: admin suspends user, compromised tokens, password change */
  if (payload.id && payload.iat) {
    try {
      const revokedAt = await getUserRevocationTime(payload.id);
      if (revokedAt && payload.iat < revokedAt) {
        return res.status(401).json({
          error: 'Session invalidated. Please sign in again.',
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] Revocation check failed:', err.message);
        return res.status(503).json({ error: 'Security service temporarily unavailable' });
      }
    }
  }

  /* ── 4. Attach user to request ──────────────────────────────── */
  req.user       = payload;
  req.hospitalId = payload.hospitalId;

  next();
}
