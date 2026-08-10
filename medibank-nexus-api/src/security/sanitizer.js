import hpp from 'hpp';
/* ── 1. XSS clean — strips <script> tags and JS event handlers ─ */
export function cleanXSS(val) {
    if (typeof val === 'string') {
        let clean = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        clean = clean.replace(/<[^>]*>/g, '');
        clean = clean.replace(/(javascript|vbscript|data):/gi, '');
        clean = clean.replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]*)/gi, '');
        return clean;
    }
    if (Array.isArray(val)) {
        return val.map(cleanXSS);
    }
    if (val && typeof val === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(val)) {
            if (k === '__proto__' || k === 'constructor' || k === 'prototype')
                continue;
            result[k] = cleanXSS(v);
        }
        return result;
    }
    return val;
}
export function xssSanitizer(req, res, next) {
    if (req.body)
        req.body = cleanXSS(req.body);
    if (req.query)
        req.query = cleanXSS(req.query);
    if (req.params)
        req.params = cleanXSS(req.params);
    next();
}
/* ── 2. HTTP Parameter Pollution prevention ─────────────────── */
export const hppProtection = hpp({
    whitelist: [
        'status', 'role', 'ids',
    ],
});
/* ── 3. Deep object sanitizer ────────────────────────────────── */
function sanitizeValue(val) {
    if (typeof val === 'string') {
        return val
            .replace(/\0/g, '')
            .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
            .replace(/\.\.\//g, '')
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
        if (k === '__proto__' || k === 'constructor' || k === 'prototype')
            continue;
        result[k] = sanitizeValue(v);
    }
    return result;
}
export function deepSanitizer(req, _res, next) {
    if (req.body && typeof req.body === 'object')
        req.body = sanitizeObject(req.body);
    if (req.query && typeof req.query === 'object')
        req.query = sanitizeObject(req.query);
    if (req.params && typeof req.params === 'object')
        req.params = sanitizeObject(req.params);
    next();
}
/* ── 4. Request size guard ───────────────────────────────────── */
export function requestSizeGuard(maxBytes = 1_048_576) {
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
export function enforceJsonContentType(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const ct = req.headers['content-type'] ?? '';
        if (!ct.includes('application/json')) {
            return res.status(415).json({
                error: 'Content-Type must be application/json',
            });
        }
    }
    next();
}
//# sourceMappingURL=sanitizer.js.map