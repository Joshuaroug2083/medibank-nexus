/**
 * Settings Routes — Server-side persistence of user preferences.
 * Supplements the localStorage approach: settings are synced to DB
 * so they survive browser clears and work across devices.
 */
import { Router } from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── GET /api/v1/settings ──────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const row = await db('user_settings')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId })
      .first();

    return res.json({ settings: row?.settings ?? {} });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/settings ──────────────────────────────────── */
router.put('/', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object is required' });
    }

    /* Strip any sensitive fields that should never leave the client */
    const { security, ...safeSettings } = settings;

    await db('user_settings')
      .insert({
        user_id:     req.user.id,
        hospital_id: req.hospitalId,
        settings:    JSON.stringify(safeSettings),
        updated_at:  new Date(),
      })
      .onConflict(['user_id'])
      .merge(['settings', 'updated_at']);

    audit({
      userId:     req.user.id,
      hospitalId: req.hospitalId,
      action:     'settings_update',
      entity:     'user_settings',
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/v1/settings ─ Reset to defaults ────────────── */
router.delete('/', async (req, res, next) => {
  try {
    await db('user_settings')
      .where({ user_id: req.user.id, hospital_id: req.hospitalId })
      .delete();

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
