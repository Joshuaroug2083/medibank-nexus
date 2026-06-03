/**
 * Request Sanitization Middleware
 *
 * Runs on every incoming request to strip/neutralize:
 *   - XSS payloads in body, query, and params
 *   - HTTP Parameter Pollution (duplicate keys)
 *   - Oversized request bodies
 *   - Null-byte injection
 *   - Unicode control characters
 *
 * Note: This runs AFTER express.json() so req.body is already parsed.
 */
import xssClean from 'xss-clean';
import hpp       from 'hpp';

/* ── 1. XSS clean — strips <script> tags and JS event handlers ─ */
export const xssSanitizer = xssClean();

/* ── 2. HTTP Parameter Pollution prevention ─────────────────── */
/* If a key appears multiple times in query string, keep the last value */
export const hppProtection = hpp({
  whitelist: [
    /* Allow arrays for these legitimate multi-value params */
    'status', 'role', 'ids',
  ],
});

/* ── 3. Deep object sanitizer ────────────────────────────────── */
/**
 * Recursively walk an object and strip dangerous characters from all strings.
 * Applied to req.body, req.query, req.params.
 */
function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val
      .replace(/\0/g, '')              // null bytes
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')  // control chars
      .replace(/\.\.\//g, '')           // path traversal sequences
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === 'object') {
    return sanitizeObject(val);
  }
  return val;
}

function sanitizeObject(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    /* Reject prototype pollution attempts */
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    result[k] = sanitizeValue(v);
  }
  return result;
}

export function deepSanitizer(req, _res, next) {
  if (req.body   && typeof req.body   === 'object') req.body   = sanitizeObject(req.body);
  if (req.query  && typeof req.query  === 'object') req.query  = sanitizeObject(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeObject(req.params);
  next();
}

/* ── 4. Request size guard ───────────────────────────────────── */
/**
 * Reject requests with a Content-Length above the threshold.
 * express.json({ limit }) handles the actual stream, but this gives
 * a cleaner error message before body parsing.
 */
export function requestSizeGuard(maxBytes = 1_048_576) {  // 1 MB default
  return (req, res, next) => {
    const length = parseInt(req.headers['content-length'] ?? '0', 10);
    if (length > maxBytes) {
      return res.status(413).json({
        error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)} KB.`,
      });
    }
    next();
  };
}

/* ── 5. Content-Type enforcement ─────────────────────────────── */
/**
 * All POST/PUT/PATCH requests must send application/json.
 * Rejects form submissions and multipart (not supported on this API).
 */
export function enforceJsonContentType(req, res, next) {
  if (['POST','PUT','PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type must be application/json',
      });
    }
  }
  next();
}
