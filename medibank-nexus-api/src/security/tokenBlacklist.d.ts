/**
 * Add a token JTI to the blacklist.
 * @param {string} jti   — The JWT's unique ID (jti claim)
 * @param {number} exp   — Token expiry epoch seconds (from JWT payload)
 */
export function blacklistToken(jti: string, exp: number): Promise<void>;
/**
 * Check if a token JTI is blacklisted.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
export function isBlacklisted(jti: string): Promise<boolean>;
/**
 * Revoke ALL tokens for a user (e.g. admin disabling an account).
 * We store a per-user revocation timestamp; auth middleware rejects
 * tokens issued before this timestamp.
 * @param {string} userId
 */
export function revokeAllUserTokens(userId: string): Promise<void>;
/**
 * Get the revocation timestamp for a user (if any).
 * Tokens issued before this time are invalid.
 * @param {string} userId
 * @returns {Promise<number|null>} epoch seconds or null
 */
export function getUserRevocationTime(userId: string): Promise<number | null>;
