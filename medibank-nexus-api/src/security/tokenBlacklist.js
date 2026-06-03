/**
 * JWT Token Blacklist
 *
 * When a user logs out or an admin revokes a token, the token's JTI
 * (JWT ID) is stored in Redis with a TTL equal to the token's remaining
 * lifetime. Every authenticated request checks this blacklist.
 *
 * This ensures "logout is real" — even if someone intercepts a token,
 * it becomes immediately invalid after the user signs out.
 */
import { getRedis } from './redisClient.js';

const PREFIX = 'blacklist:token:';

/**
 * Add a token JTI to the blacklist.
 * @param {string} jti   — The JWT's unique ID (jti claim)
 * @param {number} exp   — Token expiry epoch seconds (from JWT payload)
 */
export async function blacklistToken(jti, exp) {
  const redis    = await getRedis();
  const ttlSec   = Math.max(0, exp - Math.floor(Date.now() / 1000));
  if (ttlSec > 0) {
    await redis.setex(`${PREFIX}${jti}`, ttlSec, '1');
  }
}

/**
 * Check if a token JTI is blacklisted.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
export async function isBlacklisted(jti) {
  const redis  = await getRedis();
  const result = await redis.exists(`${PREFIX}${jti}`);
  return result === 1;
}

/**
 * Revoke ALL tokens for a user (e.g. admin disabling an account).
 * We store a per-user revocation timestamp; auth middleware rejects
 * tokens issued before this timestamp.
 * @param {string} userId
 */
export async function revokeAllUserTokens(userId) {
  const redis = await getRedis();
  const now   = Math.floor(Date.now() / 1000);
  /* Keep for 8 hours (max token lifetime) */
  await redis.setex(`blacklist:user:${userId}`, 8 * 3600, String(now));
}

/**
 * Get the revocation timestamp for a user (if any).
 * Tokens issued before this time are invalid.
 * @param {string} userId
 * @returns {Promise<number|null>} epoch seconds or null
 */
export async function getUserRevocationTime(userId) {
  const redis = await getRedis();
  const val   = await redis.get(`blacklist:user:${userId}`);
  return val ? parseInt(val) : null;
}
