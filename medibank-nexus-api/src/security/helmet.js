/**
 * HTTP Security Headers — Helmet Configuration
 *
 * Protects against:
 *   - XSS via Content-Security-Policy
 *   - Clickjacking via X-Frame-Options / frame-ancestors
 *   - MIME sniffing via X-Content-Type-Options
 *   - Protocol downgrade via HSTS (HTTPS-only in production)
 *   - Information leakage via X-Powered-By removal
 *   - Cross-origin attacks via CORP / COOP / COEP headers
 */
import helmet from 'helmet';

const isProd = process.env.NODE_ENV === 'production';

export const helmetConfig = helmet({

  /* ── Content-Security-Policy ────────────────────────────────── */
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],   // allow inline styles (API has no UI but covers admin pages)
      imgSrc:         ["'self'", 'data:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      mediaSrc:       ["'none'"],
      frameSrc:       ["'none'"],
      frameAncestors: ["'none'"],                       // prevent embedding in iframes
      formAction:     ["'self'"],
      baseUri:        ["'self'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },

  /* ── HTTP Strict Transport Security ────────────────────────── */
  /* HTTPS only — enforced in production. 1 year max-age. */
  hsts: isProd
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,

  /* ── Prevent MIME-type sniffing ─────────────────────────────── */
  noSniff: true,

  /* ── Prevent clickjacking ───────────────────────────────────── */
  frameguard: { action: 'deny' },

  /* ── Remove X-Powered-By header ─────────────────────────────── */
  hidePoweredBy: true,

  /* ── Referrer Policy ────────────────────────────────────────── */
  referrerPolicy: { policy: 'no-referrer' },

  /* ── Cross-Origin Resource Policy ──────────────────────────── */
  crossOriginResourcePolicy: { policy: 'same-origin' },

  /* ── Cross-Origin Opener Policy ─────────────────────────────── */
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  /* ── Cross-Origin Embedder Policy ──────────────────────────── */
  crossOriginEmbedderPolicy: false,      // disabled — API served separately from frontend

  /* ── DNS Prefetch Control ───────────────────────────────────── */
  dnsPrefetchControl: { allow: false },

  /* ── Permitted Cross-Domain Policies ───────────────────────── */
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});
