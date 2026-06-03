/**
 * Field-Level AES-256-GCM Encryption
 *
 * Protects Personally Identifiable Information (PII) stored in the database.
 * Even if the database is compromised, encrypted fields cannot be read
 * without the ENCRYPTION_KEY environment variable.
 *
 * Algorithm: AES-256-GCM
 *   - 256-bit key (32 bytes)
 *   - 96-bit random IV per encryption (12 bytes)
 *   - 128-bit authentication tag (16 bytes)
 *   - Authenticated encryption: detects tampering
 *
 * Storage format (stored as a single string in DB):
 *   "enc:v1:<base64_iv>:<base64_authTag>:<base64_ciphertext>"
 *
 * Encrypted fields in patients table:
 *   nin, phone, email, address, ec_phone, ins_number
 *
 * CRITICAL: Back up ENCRYPTION_KEY securely. Losing the key = permanent data loss.
 */
import crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12;    // 96 bits — recommended for GCM
const TAG_LENGTH = 16;    // 128 bits — GCM auth tag
const PREFIX     = 'enc:v1:';

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('ENCRYPTION_KEY environment variable is not set');
  if (keyHex.length !== 64) {
    throw new Error(`ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${keyHex.length} chars.`);
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns the formatted storage string or null if input is null/undefined.
 */
export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;

  const key        = getKey();
  const iv         = crypto.randomBytes(IV_LENGTH);
  const cipher     = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted  = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag        = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt a stored encrypted string.
 * Returns the original plaintext or null if input is null/undefined/unencrypted.
 */
export function decrypt(stored) {
  if (stored === null || stored === undefined) return null;

  /* If the value was stored before encryption was enabled, return as-is */
  if (!String(stored).startsWith(PREFIX)) return stored;

  try {
    const [, , ivB64, tagB64, ctB64] = stored.split(':');
    const key        = getKey();
    const iv         = Buffer.from(ivB64,  'base64');
    const tag        = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ctB64,  'base64');

    const decipher   = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    /* Auth tag mismatch = data was tampered — log but do not crash */
    console.error('[ENCRYPTION] Decryption failed — possible data tampering:', err.message);
    return '[DECRYPTION ERROR]';
  }
}

/**
 * Check if a stored value is currently encrypted.
 */
export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/* ─── Convenience: encrypt only if not already encrypted ─────── */
export function encryptIfNeeded(value) {
  if (!value || isEncrypted(value)) return value;
  return encrypt(value);
}

/* ─── Encrypt all PII fields in a patient object ──────────────── */
const PATIENT_PII_FIELDS = ['nin', 'phone', 'email', 'address', 'ec_phone', 'ins_number'];

export function encryptPatient(patientData) {
  const result = { ...patientData };
  for (const field of PATIENT_PII_FIELDS) {
    if (field in result) result[field] = encryptIfNeeded(result[field]);
  }
  return result;
}

/* ─── Decrypt all PII fields in a patient object ──────────────── */
export function decryptPatient(patientRow) {
  if (!patientRow) return null;
  const result = { ...patientRow };
  for (const field of PATIENT_PII_FIELDS) {
    if (field in result) result[field] = decrypt(result[field]);
  }
  return result;
}

/* ─── Decrypt an array of patient rows ───────────────────────── */
export function decryptPatients(rows) {
  return rows.map(decryptPatient);
}

/* ─── Mask a value for display (show only last 4 chars) ──────── */
export function mask(value, visibleChars = 4) {
  if (!value) return null;
  const str = String(value);
  if (str.length <= visibleChars) return '*'.repeat(str.length);
  return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
}

/**
 * Generate a cryptographically secure random token.
 * Used for refresh tokens, password reset tokens, etc.
 */
export function secureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Constant-time string comparison — prevents timing attacks
 * when comparing secrets/tokens.
 */
export function safeCompare(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
