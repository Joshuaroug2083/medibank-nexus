/**
 * Compliance & NDPR Routes
 *
 *   GET  /api/v1/compliance/dsr          — list data subject requests (admin)
 *   POST /api/v1/compliance/dsr          — submit a DSR (public — no auth required)
 *   GET  /api/v1/compliance/dsr/:id      — get DSR detail
 *   PUT  /api/v1/compliance/dsr/:id      — update DSR status (admin)
 *   GET  /api/v1/compliance/audit-log    — paginated audit log viewer (admin)
 */
import { Router }   from 'express';
import db            from '../db.js';
import authenticate  from '../middleware/auth.js';
import { allow }     from '../middleware/rbac.js';
import { audit }     from '../middleware/audit.js';

const router = Router();

/* ── POST /api/v1/compliance/dsr (public) ───────────────────── */
/* Patients / data subjects submit access / erasure requests.
   No auth required — but we validate the hospital exists.        */
router.post('/dsr', async (req, res, next) => {
  try {
    const { hospitalId, requestType, requesterName, requesterEmail, description, patientId } = req.body;

    if (!hospitalId || !requestType || !requesterName || !requesterEmail) {
      return res.status(400).json({ error: 'hospitalId, requestType, requesterName and requesterEmail are required' });
    }

    const validTypes = ['access','erasure','portability','rectification','objection'];
    if (!validTypes.includes(requestType)) {
      return res.status(400).json({ error: `requestType must be one of: ${validTypes.join(', ')}` });
    }

    const hospital = await db('hospitals').where({ id: hospitalId }).first();
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // NDPR: 1 month

    const [dsr] = await db('data_subject_requests').insert({
      hospital_id:     hospitalId,
      patient_id:      patientId ?? null,
      request_type:    requestType,
      requester_name:  requesterName,
      requester_email: requesterEmail,
      description:     description ?? null,
      status:          'pending',
      due_date:        dueDate,
      created_at:      new Date(),
      updated_at:      new Date(),
    }).returning('*');

    return res.status(201).json({
      message: 'Your data request has been submitted. We will respond within 30 days.',
      id:      dsr.id,
      dueDate: dsr.due_date,
    });
  } catch (err) { next(err); }
});

/* ── All routes below require authentication ─────────────────── */
router.use(authenticate);

/* ── GET /api/v1/compliance/dsr ─────────────────────────────── */
router.get('/dsr', allow('admin'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let q = db('data_subject_requests as d')
      .leftJoin('users as u', 'u.id', 'd.handled_by')
      .where('d.hospital_id', req.hospitalId)
      .select('d.*', 'u.name as handled_by_name');

    if (status) q = q.where('d.status', status);

    const [{ count }] = await q.clone().count('d.id as count');
    const requests    = await q.orderBy('d.created_at', 'desc').limit(limit).offset(offset);

    return res.json({ requests, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/compliance/dsr/:id ─────────────────────────── */
router.get('/dsr/:id', allow('admin'), async (req, res, next) => {
  try {
    const dsr = await db('data_subject_requests')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .first();

    if (!dsr) return res.status(404).json({ error: 'Request not found' });
    return res.json({ dsr });
  } catch (err) { next(err); }
});

/* ── PUT /api/v1/compliance/dsr/:id ─────────────────────────── */
router.put('/dsr/:id', allow('admin'), async (req, res, next) => {
  try {
    const { status, responseNotes } = req.body;
    const validStatuses = ['pending','in_review','completed','rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const patch = {
      updated_at:     new Date(),
      handled_by:     req.user.id,
    };
    if (status)          patch.status         = status;
    if (responseNotes)   patch.response_notes = responseNotes;
    if (status === 'completed' || status === 'rejected') {
      patch.completed_at = new Date();
    }

    const [dsr] = await db('data_subject_requests')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update(patch)
      .returning('*');

    if (!dsr) return res.status(404).json({ error: 'Request not found' });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: `dsr_${status}`, entity: 'dsr', entityId: String(dsr.id) });
    return res.json({ dsr });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/compliance/audit-log ───────────────────────── */
router.get('/audit-log', allow('admin'), async (req, res, next) => {
  try {
    const {
      userId, action, entity, from, to,
      page = 1, limit = 50,
    } = req.query;
    const offset = (page - 1) * limit;

    let q = db('audit_logs as al')
      .leftJoin('users as u', 'u.id', 'al.user_id')
      .where('al.hospital_id', req.hospitalId)
      .select(
        'al.*',
        'u.name as user_name', 'u.role as user_role',
      );

    if (userId) q = q.where('al.user_id', userId);
    if (action) q = q.whereRaw('al.action like ?', [`%${action}%`]);
    if (entity) q = q.where('al.entity', entity);
    if (from)   q = q.where('al.created_at', '>=', from);
    if (to)     q = q.where('al.created_at', '<=', to);

    const [{ count }] = await q.clone().count('al.id as count');
    const logs        = await q.orderBy('al.created_at', 'desc').limit(limit).offset(offset);

    return res.json({ logs, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) { next(err); }
});

export default router;
