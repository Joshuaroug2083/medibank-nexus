/**
 * MediBank Nexus API — Secured Entry Point
 *
 * Security layers applied (in order):
 *   1.  Helmet            — HTTP security headers (CSP, HSTS, X-Frame-Options…)
 *   2.  CORS              — Strict origin allowlist
 *   3.  Request size cap  — Rejects bodies > 1 MB before parsing
 *   4.  Body parsing      — express.json with size limit
 *   5.  XSS sanitizer     — Strips script tags / event handlers from all inputs
 *   6.  HPP protection    — Blocks HTTP Parameter Pollution
 *   7.  Deep sanitizer    — Removes null bytes, path traversal, control chars
 *   8.  Content-Type guard— Enforces application/json on write requests
 *   9.  General rate limit— 100 req / 15 min per IP across all routes
 *   10. Morgan logging    — Request log (no PII logged, condensed in prod)
 *   ─── then route handlers ───
 *   11. authLimiter       — 10 req / 15 min on /auth routes
 *   12. lockoutGuard      — Account lockout after 5 failed logins
 *   13. authenticate      — JWT verify + blacklist check
 *   14. rbac allow()      — Role guard per endpoint
 *   15. Validators        — express-validator schemas
 *   16. dataFilter        — Role-based field masking
 *   17. Encryption        — AES-256-GCM on PII before DB write / after DB read
 */
import 'dotenv/config';
import express      from 'express';
import cors         from 'cors';
import morgan       from 'morgan';

/* Security */
import { helmetConfig }                          from './security/helmet.js';
import { generalLimiter, attachRedisStores }     from './security/rateLimiter.js';
import {
  xssSanitizer,
  hppProtection,
  deepSanitizer,
  requestSizeGuard,
  enforceJsonContentType,
}                                                from './security/sanitizer.js';
import { getRedis }                              from './security/redisClient.js';

/* Routes */
import authRoutes         from './routes/auth.js';
import patientRoutes      from './routes/patients.js';
import visitRoutes        from './routes/visits.js';
import pharmacyRoutes     from './routes/pharmacy.js';
import appointmentRoutes  from './routes/appointments.js';
import analyticsRoutes    from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes           from './routes/ai.js';
import hospitalRoutes     from './routes/hospitals.js';
import staffRoutes        from './routes/staff.js';
import settingsRoutes     from './routes/settings.js';
import integrationsRoutes from './routes/integrations.js';
import billingRoutes      from './routes/billing.js';
import labRoutes          from './routes/lab.js';
import exportRoutes       from './routes/export.js';
import formularyRoutes    from './routes/formulary.js';
import inpatientRoutes    from './routes/inpatient.js';
import referralRoutes     from './routes/referrals.js';
import complianceRoutes   from './routes/compliance.js';
import { startReminderJob } from './jobs/reminderJob.js';

const app  = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

/* ════════════════════════════════════════════════════════════════
   LAYER 1 — HTTP SECURITY HEADERS
════════════════════════════════════════════════════════════════ */
app.use(helmetConfig);

/* Disable fingerprinting (belt-and-suspenders with helmet) */
app.disable('x-powered-by');

/* ════════════════════════════════════════════════════════════════
   LAYER 2 — CORS
════════════════════════════════════════════════════════════════ */
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    /* Allow requests with no origin (mobile apps, Postman in dev) */
    if (!origin && !isProd) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials:      true,
  methods:          ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders:   ['Content-Type','Authorization'],
  exposedHeaders:   ['X-RateLimit-Limit','X-RateLimit-Remaining','Retry-After'],
  maxAge:           600,   // preflight cache 10 min
}));

/* ════════════════════════════════════════════════════════════════
   LAYER 3 — REQUEST SIZE CAP (before body parsing)
════════════════════════════════════════════════════════════════ */
app.use(requestSizeGuard(1_048_576));   // 1 MB

/* ════════════════════════════════════════════════════════════════
   LAYER 3b — RAW BODY for Paystack webhook (must come before json())
   Paystack HMAC-SHA512 verification requires the raw request body.
════════════════════════════════════════════════════════════════ */
app.use('/api/v1/billing/paystack-webhook', express.raw({ type: 'application/json', limit: '512kb' }));

/* ════════════════════════════════════════════════════════════════
   LAYER 4 — BODY PARSING
════════════════════════════════════════════════════════════════ */
app.use(express.json({ limit: '1mb' }));

/* ════════════════════════════════════════════════════════════════
   LAYER 5-8 — INPUT SANITIZATION
════════════════════════════════════════════════════════════════ */
app.use(xssSanitizer);          // strip <script>, JS handlers
app.use(hppProtection);         // block parameter pollution
app.use(deepSanitizer);         // null bytes, control chars, path traversal
app.use(enforceJsonContentType);// reject non-JSON write requests

/* ════════════════════════════════════════════════════════════════
   LAYER 9 — GLOBAL RATE LIMITER
════════════════════════════════════════════════════════════════ */
app.use(generalLimiter);

/* ════════════════════════════════════════════════════════════════
   LAYER 10 — REQUEST LOGGING
   Production: compact Apache Combined log (no request bodies)
   Development: concise dev format
════════════════════════════════════════════════════════════════ */
morgan.token('user-id',  (req) => req.user?.id  ?? '-');
morgan.token('tenant-id',(req) => req.hospitalId ?? '-');

const logFormat = isProd
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms tenant=:tenant-id'
  : 'dev';

app.use(morgan(logFormat, {
  skip: (req) => req.path === '/health',  // don't log health checks
}));

/* ════════════════════════════════════════════════════════════════
   HEALTH CHECK (unauthenticated, before rate limit counted)
════════════════════════════════════════════════════════════════ */
app.get('/health', (_req, res) =>
  res.json({
    status:  'ok',
    version: '1.0.0',
    time:    new Date().toISOString(),
  }),
);

/* ════════════════════════════════════════════════════════════════
   API ROUTES
════════════════════════════════════════════════════════════════ */
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/hospitals',     hospitalRoutes);
app.use('/api/v1/staff',         staffRoutes);
app.use('/api/v1/patients',      patientRoutes);
app.use('/api/v1/visits',        visitRoutes);
app.use('/api/v1/pharmacy',      pharmacyRoutes);
app.use('/api/v1/appointments',  appointmentRoutes);
app.use('/api/v1/analytics',     analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ai',            aiRoutes);
app.use('/api/v1/settings',      settingsRoutes);
app.use('/api/v1/integrations',  integrationsRoutes);
app.use('/api/v1/billing',       billingRoutes);
app.use('/api/v1/lab',           labRoutes);
app.use('/api/v1/export',        exportRoutes);
app.use('/api/v1/formulary',     formularyRoutes);
app.use('/api/v1/inpatient',     inpatientRoutes);
app.use('/api/v1/referrals',     referralRoutes);
app.use('/api/v1/compliance',    complianceRoutes);

/* ════════════════════════════════════════════════════════════════
   404 HANDLER
════════════════════════════════════════════════════════════════ */
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

/* ════════════════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER
   IMPORTANT: Never leak stack traces or internal details in production
════════════════════════════════════════════════════════════════ */
app.use((err, req, res, _next) => {
  /* CORS errors */
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  const status = err.status ?? err.statusCode ?? 500;

  /* Log full error server-side */
  console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  if (status === 500) console.error(err.stack);

  /* Client response: never expose internals in production */
  return res.status(status).json({
    error: isProd && status === 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

/* ════════════════════════════════════════════════════════════════
   STARTUP
════════════════════════════════════════════════════════════════ */
async function start() {
  /* Initialise Redis + attach stores to rate limiters */
  try {
    await getRedis();
    await attachRedisStores();
    console.log('[Security] Rate limiters using Redis store');
  } catch (err) {
    if (isProd) {
      console.error('[FATAL] Cannot start without Redis in production:', err.message);
      process.exit(1);
    }
    console.warn('[Security] Redis unavailable — using in-memory fallback (dev only)');
  }

  /* Validate critical environment variables */
  const required = ['JWT_SECRET','ENCRYPTION_KEY'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.ENCRYPTION_KEY?.length !== 64) {
    console.error('[FATAL] ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\nMediBank Nexus API  ·  http://localhost:${PORT}`);
    console.log(`Environment : ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`Security    : Helmet, Rate Limiting, JWT Blacklist, AES-256 Encryption, Lockout`);
    console.log(`CORS origin : ${allowedOrigins.join(', ')}\n`);

    /* Start background jobs (appointment reminders, etc.) */
    startReminderJob();
  });
}

/* Graceful shutdown */
process.on('SIGTERM', () => { console.log('SIGTERM received — shutting down'); process.exit(0); });
process.on('SIGINT',  () => { console.log('SIGINT received — shutting down');  process.exit(0); });

start();
