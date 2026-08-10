import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const TAG_LENGTH = 16; // 128 bits — GCM auth tag
const PREFIX = 'enc:v1:';
function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex)
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    if (keyHex.length !== 64) {
        throw new Error(`ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${keyHex.length} chars.`);
    }
    return Buffer.from(keyHex, 'hex');
}
export function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined)
        return null;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}
export function decrypt(stored) {
    if (stored === null || stored === undefined)
        return null;
    /* If the value was stored before encryption was enabled, return as-is */
    if (!String(stored).startsWith(PREFIX))
        return String(stored);
    try {
        const [, , ivB64, tagB64, ctB64] = stored.split(':');
        const key = getKey();
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const ciphertext = Buffer.from(ctB64, 'base64');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    }
    catch (err) {
        /* Auth tag mismatch = data was tampered — log but do not crash */
        console.error('[ENCRYPTION] Decryption failed — possible data tampering:', err.message);
        return '[DECRYPTION ERROR]';
    }
}
export function isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(PREFIX);
}
export function encryptIfNeeded(value) {
    if (!value || isEncrypted(value))
        return value;
    return encrypt(value);
}
const PATIENT_PII_FIELDS = ['nin', 'phone', 'email', 'address', 'ec_phone', 'ins_number', 'ec_name'];
export function encryptPatient(patientData) {
    const result = { ...patientData };
    for (const field of PATIENT_PII_FIELDS) {
        if (field in result)
            result[field] = encryptIfNeeded(result[field]);
    }
    return result;
}
export function decryptPatient(patientRow) {
    if (!patientRow)
        return null;
    const result = { ...patientRow };
    for (const field of PATIENT_PII_FIELDS) {
        if (field in result)
            result[field] = decrypt(result[field]);
    }
    return result;
}
export function decryptPatients(rows) {
    return rows.map(row => decryptPatient(row)).filter((row) => row !== null);
}
export function mask(value, visibleChars = 4) {
    if (!value)
        return null;
    const str = String(value);
    if (str.length <= visibleChars)
        return '*'.repeat(str.length);
    return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
}
export function secureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}
export function safeCompare(a, b) {
    const aBuf = Buffer.from(String(a));
    const bBuf = Buffer.from(String(b));
    if (aBuf.length !== bBuf.length)
        return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}
//# sourceMappingURL=encryption.js.map