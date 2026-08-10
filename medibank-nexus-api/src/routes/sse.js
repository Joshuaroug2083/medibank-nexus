/**
 * SSE (Server-Sent Events) Route
 *
 * GET /api/v1/sse — persistent connection per authenticated user.
 * The server pushes JSON-encoded events over the stream.
 *
 * Event types:
 *   notification   — a new in-app notification for this user / broadcast
 *   ping           — keep-alive heartbeat (every 25 s)
 *
 * Clients are stored in a per-hospital Map so notification.js can
 * call `broadcast(hospitalId, payload)` to fan-out to all connected users.
 *
 * Security:
 *   - Requires a valid JWT (authenticate middleware)
 *   - Each client is isolated by hospitalId — no cross-tenant leakage
 *   - Connection is closed on client disconnect (req 'close' event)
 */
import { Router } from 'express';
import authenticate from '../middleware/auth.js';

const router = Router();

/**
 * In-memory store: Map<hospitalId, Map<userId+connId, res>>
 * connId is appended so the same user can have multiple browser tabs open.
 */
const clients = new Map();

/**
 * Broadcast a JSON event payload to all SSE clients of a given hospital.
 * Call this from notification.js after inserting a notification row.
 *
 * @param {string|number} hospitalId
 * @param {object} payload  — e.g. { type: 'notification', data: { ... } }
 * @param {string|number|null} targetUserId — if set, only sends to that user
 */
export function broadcast(hospitalId, payload, targetUserId = null) {
  const tenantClients = clients.get(String(hospitalId));
  if (!tenantClients) return;

  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const [connKey, res] of tenantClients) {
    try {
      if (targetUserId !== null && !connKey.startsWith(String(targetUserId) + ':')) {
        continue; // skip connections that don't belong to the target user
      }
      res.write(message);
    } catch {
      /* connection already closed; will be cleaned up on 'close' event */
    }
  }
}

/* ── GET /api/v1/sse ──────────────────────────────────────── */
router.get('/', authenticate, (req, res) => {
  const hospitalId = String(req.hospitalId);
  const userId     = String(req.user.id);
  const connId     = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const connKey    = `${userId}:${connId}`;

  /* SSE headers */
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  /* Register client */
  if (!clients.has(hospitalId)) clients.set(hospitalId, new Map());
  clients.get(hospitalId).set(connKey, res);

  /* Send an initial connected event */
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  /* Keep-alive ping every 25 seconds */
  const ping = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`); }
    catch { clearInterval(ping); }
  }, 25_000);

  /* Clean up on disconnect */
  req.on('close', () => {
    clearInterval(ping);
    const tenantClients = clients.get(hospitalId);
    if (tenantClients) {
      tenantClients.delete(connKey);
      if (tenantClients.size === 0) clients.delete(hospitalId);
    }
  });
});

export default router;
