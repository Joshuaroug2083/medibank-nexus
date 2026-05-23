/**
 * Integrations Routes
 *
 * Handles:
 *  1. Google OAuth2 — Calendar, Drive, Docs (all via one consent screen)
 *  2. AI API Key management — store, test, delete per provider
 *  3. Google Calendar sync — push appointments as events
 *  4. ICS export — generate iCalendar file from appointments
 *
 * Google OAuth flow:
 *   Frontend → GET /google/auth-url → redirect user to consent screen
 *   Google → GET /google/oauth-callback?code=... → exchange code for tokens
 *   Callback page posts message to parent window → frontend updates state
 *
 * Environment variables required:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 *   OPENAI_API_KEY (platform fallback), GOOGLE_AI_API_KEY (platform fallback)
 */
import { Router } from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { audit }    from '../middleware/audit.js';
import { encrypt, decrypt } from '../security/encryption.js';

const router = Router();

/* ── Google OAuth scopes ──────────────────────────────────── */
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
].join(' ');

/* ── GET /api/v1/integrations/google/auth-url ──────────────── */
router.get('/google/auth-url', authenticate, async (req, res, next) => {
  try {
    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.API_BASE_URL}/api/v1/integrations/google/oauth-callback`;

    if (!clientId) {
      return res.status(501).json({
        error: 'Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }

    /* Encode user context in state so callback can identify the user */
    const state = Buffer.from(JSON.stringify({
      userId:     req.user.id,
      hospitalId: req.hospitalId,
      ts:         Date.now(),
    })).toString('base64url');

    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         GOOGLE_SCOPES,
      access_type:   'offline',
      prompt:        'consent',
      state,
    });

    return res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/integrations/google/oauth-callback ────────── */
/* This is opened in a popup — it sends a postMessage to the parent window */
router.get('/google/oauth-callback', async (req, res) => {
  const { code, state, error } = req.query;

  /* Build the HTML page that handles the callback */
  if (error) {
    return res.send(callbackPage({ error: `Google denied access: ${error}` }));
  }

  if (!code || !state) {
    return res.send(callbackPage({ error: 'Invalid callback — missing code or state.' }));
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { userId, hospitalId } = stateData;

    /* Exchange authorization code for tokens */
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI ?? `${process.env.API_BASE_URL}/api/v1/integrations/google/oauth-callback`,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description ?? 'Token exchange failed');

    /* Get the user's Google profile */
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    /* Store encrypted tokens */
    const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
    await db('user_integrations')
      .insert({
        user_id:        userId,
        hospital_id:    hospitalId,
        provider:       'google',
        access_token:   encrypt(tokens.access_token),
        refresh_token:  tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        token_expiry:   expiry,
        scopes:         GOOGLE_SCOPES.split(' '),
        provider_email: profile.email,
        connected_at:   new Date(),
        updated_at:     new Date(),
      })
      .onConflict(['user_id', 'provider'])
      .merge(['access_token', 'refresh_token', 'token_expiry', 'scopes', 'provider_email', 'updated_at']);

    audit({ userId, hospitalId, action: 'google_oauth_connect', entity: 'integration' });

    return res.send(callbackPage({
      success: true,
      email:   profile.email,
      scopes:  GOOGLE_SCOPES.split(' '),
    }));
  } catch (err) {
    console.error('[OAuth Callback Error]', err.message);
    return res.send(callbackPage({ error: err.message }));
  }
});

/* ── DELETE /api/v1/integrations/google/disconnect ────────── */
router.delete('/google/disconnect', authenticate, async (req, res, next) => {
  try {
    /* Attempt to revoke token server-side */
    const row = await db('user_integrations')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId, provider: 'google' })
      .first();

    if (row?.access_token) {
      const token = decrypt(row.access_token);
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' })
        .catch(() => { /* best-effort revocation */ });
    }

    await db('user_integrations')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId, provider: 'google' })
      .delete();

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'google_oauth_disconnect', entity: 'integration' });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/integrations/status ───────────────────────── */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const rows = await db('user_integrations')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId })
      .select('provider', 'provider_email', 'scopes', 'connected_at', 'token_expiry');

    const status = {};
    for (const row of rows) {
      status[row.provider] = {
        connected:   true,
        email:       row.provider_email,
        scopes:      row.scopes,
        connectedAt: row.connected_at,
        expired:     row.token_expiry ? new Date(row.token_expiry) < new Date() : false,
      };
    }

    return res.json({ status });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/integrations/ai-keys ──────────────────────── */
router.put('/ai-keys', authenticate, async (req, res, next) => {
  try {
    const { provider, key } = req.body;
    const ALLOWED = ['anthropic', 'openai', 'google'];

    if (!ALLOWED.includes(provider)) {
      return res.status(400).json({ error: `Invalid provider. Must be one of: ${ALLOWED.join(', ')}` });
    }

    if (!key || typeof key !== 'string') {
      /* Deleting the key */
      await db('user_integrations')
        .where({ user_id: req.user.id, hospital_id: req.hospitalId, provider })
        .delete();
      return res.json({ ok: true, action: 'deleted' });
    }

    /* Basic key format validation */
    const keyValidators = {
      anthropic: (k) => k.startsWith('sk-ant-'),
      openai:    (k) => k.startsWith('sk-'),
      google:    (k) => k.startsWith('AIza'),
    };

    if (keyValidators[provider] && !keyValidators[provider](key)) {
      return res.status(400).json({
        error: `Invalid ${provider} API key format. Please check the key and try again.`,
      });
    }

    await db('user_integrations')
      .insert({
        user_id:      req.user.id,
        hospital_id:  req.hospitalId,
        provider,
        access_token: encrypt(key),   /* reusing access_token field for AI keys */
        updated_at:   new Date(),
        connected_at: new Date(),
      })
      .onConflict(['user_id', 'provider'])
      .merge(['access_token', 'updated_at']);

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'ai_key_saved', entity: 'integration', meta: { provider } });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/integrations/ai-keys/test ────────────────── */
router.post('/ai-keys/test', authenticate, async (req, res, next) => {
  try {
    const { provider } = req.body;
    const ALLOWED = ['anthropic', 'openai', 'google'];
    if (!ALLOWED.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const row = await db('user_integrations')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId, provider })
      .first();

    let apiKey = row?.access_token ? decrypt(row.access_token) : null;

    /* Fall back to platform key */
    if (!apiKey) {
      const envMap = { anthropic: process.env.ANTHROPIC_API_KEY, openai: process.env.OPENAI_API_KEY, google: process.env.GOOGLE_AI_API_KEY };
      apiKey = envMap[provider];
    }

    if (!apiKey) {
      return res.status(404).json({ error: 'No API key found for this provider' });
    }

    /* Send a minimal test request */
    let testRes;
    switch (provider) {
      case 'anthropic':
        testRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
        });
        break;
      case 'openai':
        testRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
        });
        break;
      case 'google':
        testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }], generationConfig: { maxOutputTokens: 10 } }),
        });
        break;
    }

    if (testRes.ok) {
      return res.json({ message: `✓ Connected successfully to ${provider}` });
    } else {
      const err = await testRes.json().catch(() => ({}));
      return res.status(400).json({ error: err.error?.message ?? `Connection failed (${testRes.status})` });
    }
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/integrations/calendar/export.ics ──────────── */
/* Returns a downloadable .ics file of the user's upcoming appointments */
router.get('/calendar/export.ics', authenticate, async (req, res, next) => {
  try {
    const rows = await db('appointments')
      .where({ hospital_id: req.hospitalId })
      .modify(qb => {
        if (req.user.role === 'doctor')  qb.where('doctor_id', req.user.id);
        if (req.user.role === 'patient') qb.where('patient_id', req.user.id);
      })
      .where('scheduled_at', '>=', new Date())
      .orderBy('scheduled_at', 'asc')
      .limit(200)
      .select('id', 'scheduled_at', 'status', 'notes', 'duration_minutes');

    const ics = buildICS(rows);

    res.setHeader('Content-Type',        'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="medibank-appointments.ics"');
    return res.send(ics);
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/integrations/calendar/sync ───────────────── */
/* Push appointments to Google Calendar via API */
router.post('/calendar/sync', authenticate, async (req, res, next) => {
  try {
    const integration = await db('user_integrations')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId, provider: 'google' })
      .first();

    if (!integration) {
      return res.status(404).json({ error: 'Google account not connected. Connect in Settings → Integrations.' });
    }

    let accessToken = decrypt(integration.access_token);

    /* Refresh token if expired */
    if (integration.token_expiry && new Date(integration.token_expiry) < new Date()) {
      if (!integration.refresh_token) {
        return res.status(401).json({ error: 'Google token expired and no refresh token available. Please reconnect.' });
      }
      const refreshed = await refreshGoogleToken(decrypt(integration.refresh_token));
      if (!refreshed) return res.status(401).json({ error: 'Failed to refresh Google token. Please reconnect.' });

      accessToken = refreshed.access_token;
      await db('user_integrations')
        .where({ user_id: req.user.id, provider: 'google' })
        .update({
          access_token: encrypt(refreshed.access_token),
          token_expiry: new Date(Date.now() + refreshed.expires_in * 1000),
          updated_at:   new Date(),
        });
    }

    /* Fetch upcoming appointments */
    const rows = await db('appointments')
      .where({ hospital_id: req.hospitalId })
      .modify(qb => {
        if (req.user.role === 'doctor')  qb.where('doctor_id', req.user.id);
        if (req.user.role === 'patient') qb.where('patient_id', req.user.id);
      })
      .where('scheduled_at', '>=', new Date())
      .orderBy('scheduled_at', 'asc')
      .limit(50)
      .select('id', 'scheduled_at', 'status', 'notes', 'duration_minutes');

    /* Push each appointment to Google Calendar */
    let synced = 0;
    let errors = 0;
    for (const apt of rows) {
      try {
        const start = new Date(apt.scheduled_at);
        const end   = new Date(start.getTime() + (apt.duration_minutes ?? 30) * 60_000);

        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            summary:     'Medical Appointment — MediBank Nexus',
            description: apt.notes ?? '',
            start:       { dateTime: start.toISOString(), timeZone: 'Africa/Lagos' },
            end:         { dateTime: end.toISOString(),   timeZone: 'Africa/Lagos' },
            status:      apt.status === 'confirmed' ? 'confirmed' : 'tentative',
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'popup', minutes: 60 },
              ],
            },
          }),
        });
        synced++;
      } catch { errors++; }
    }

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'calendar_sync', entity: 'integration', meta: { synced } });
    return res.json({ synced, errors, total: rows.length });
  } catch (err) {
    next(err);
  }
});

/* ── Helpers ──────────────────────────────────────────────── */
async function refreshGoogleToken(refreshToken) {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type:    'refresh_token',
      }),
    });
    const data = await res.json();
    return res.ok ? data : null;
  } catch {
    return null;
  }
}

function buildICS(appointments) {
  const now = toICS(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediBank Nexus//Hospital Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MediBank Nexus Appointments',
    'X-WR-TIMEZONE:Africa/Lagos',
  ];

  for (const apt of appointments) {
    const start = new Date(apt.scheduled_at);
    const end   = new Date(start.getTime() + (apt.duration_minutes ?? 30) * 60_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:nexus-${apt.id}@medibank-nexus`,
      `DTSTAMP:${now}`,
      `DTSTART:${toICS(start)}`,
      `DTEND:${toICS(end)}`,
      `SUMMARY:Medical Appointment — MediBank Nexus`,
      `DESCRIPTION:${(apt.notes ?? '').replace(/\n/g, '\\n')}`,
      `STATUS:${apt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Appointment in 30 minutes', 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-PT1H',  'ACTION:DISPLAY', 'DESCRIPTION:Appointment in 1 hour',     'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function toICS(date) {
  const pad = n => String(n).padStart(2, '0');
  const d = new Date(date);
  return d.getUTCFullYear() + pad(d.getUTCMonth()+1) + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

/* ── OAuth popup callback page ─────────────────────────────── */
function callbackPage({ success, email, scopes, error }) {
  const payload = JSON.stringify(
    success
      ? { type: 'GOOGLE_OAUTH_SUCCESS', email, scopes }
      : { type: 'GOOGLE_OAUTH_ERROR',   error }
  );
  return `<!DOCTYPE html>
<html>
<head>
  <title>Google ${success ? 'Connected' : 'Error'} — MediBank Nexus</title>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f5fa; }
    .card { background: white; border-radius: 14px; padding: 36px 40px; text-align: center; box-shadow: 0 4px 24px rgba(10,40,80,.10); max-width: 360px; }
    .icon { font-size: 2.5rem; margin-bottom: 14px; }
    h2 { font-size: 1.1rem; font-weight: 800; margin: 0 0 8px; color: #0f1923; }
    p  { font-size: .85rem; color: #4a6580; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h2>${success ? `Connected as ${email}` : 'Connection failed'}</h2>
    <p>${success ? 'Google account connected successfully. This window will close automatically.' : error}</p>
  </div>
  <script>
    try { window.opener.postMessage(${payload}, window.location.origin); } catch(e) {}
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>`;
}

export default router;
