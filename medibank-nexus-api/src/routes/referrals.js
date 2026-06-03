/**
 * Referral System Routes
 *
 *   GET  /api/v1/referrals        — list referrals (filter by status/type/patient)
 *   POST /api/v1/referrals        — create referral
 *   GET  /api/v1/referrals/:id    — get referral detail
 *   PUT  /api/v1/referrals/:id    — update referral (accept, complete, cancel)
 */
import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── GET /api/v1/referrals ───────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { status, type, patientId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let q = db('referrals as r')
      .join('patients as p', 'p.id', 'r.patient_id')
      .leftJoin('users as fd', 'fd.id', 'r.from_doctor_id')
      .leftJoin('users as td', 'td.id', 'r.to_doctor_id')
      .where('r.hospital_id', req.hospitalId)
      .select(
        'r.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.id as patient_id',
        'fd.name as from_doctor_name',
        'td.name as to_doctor_name',
      );

    if (status)    q = q.where('r.status', status);
    if (type)      q = q.where('r.referral_type', type);
    if (patientId) q = q.where('r.patient_id', patientId);

    /* Non-doctors only see their own referrals unless admin */
    if (req.user.role === 'doctor') {
      q = q.where(function() {
        this.where('r.from_doctor_id', req.user.id).orWhere('r.to_doctor_id', req.user.id);
      });
    }

    const [{ count }] = await q.clone().count('r.id as count');
    const referrals   = await q.orderBy('r.created_at', 'desc').limit(limit).offset(offset);

    return res.json({ referrals, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/referrals ──────────────────────────────────── */
router.post('/', allow('admin','doctor','nurse'), async (req, res, next) => {
  try {
    const {
      patientId, visitId, referralType, fromDept,
      toDept, toDoctorId, toHospitalName, toSpecialist,
      reason, urgency, clinicalSummary,
    } = req.body;

    if (!patientId || !reason) {
      return res.status(400).json({ error: 'patientId and reason are required' });
    }

    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const [referral] = await db('referrals').insert({
      hospital_id:      req.hospitalId,
      patient_id:       patientId,
      visit_id:         visitId          ?? null,
      referral_type:    referralType      ?? 'internal',
      from_dept:        fromDept          ?? req.user.dept,
      from_doctor_id:   req.user.role === 'doctor' ? req.user.id : null,
      to_dept:          toDept            ?? null,
      to_doctor_id:     toDoctorId        ?? null,
      to_hospital_name: toHospitalName    ?? null,
      to_specialist:    toSpecialist      ?? null,
      reason,
      urgency:          urgency           ?? 'routine',
      clinical_summary: clinicalSummary   ?? null,
      status:           'pending',
      created_at:       new Date(),
      updated_at:       new Date(),
    }).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'referral_created', entity: 'referral', entityId: String(referral.id) });
    return res.status(201).json({ referral });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/referrals/:id ───────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const referral = await db('referrals as r')
      .join('patients as p', 'p.id', 'r.patient_id')
      .leftJoin('users as fd', 'fd.id', 'r.from_doctor_id')
      .leftJoin('users as td', 'td.id', 'r.to_doctor_id')
      .where('r.id', req.params.id)
      .where('r.hospital_id', req.hospitalId)
      .select(
        'r.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.phone as patient_phone', 'p.date_of_birth', 'p.gender',
        'fd.name as from_doctor_name',
        'td.name as to_doctor_name',
      )
      .first();

    if (!referral) return res.status(404).json({ error: 'Referral not found' });
    return res.json({ referral });
  } catch (err) { next(err); }
});

/* ── PUT /api/v1/referrals/:id ───────────────────────────────── */
router.put('/:id', allow('admin','doctor','nurse'), async (req, res, next) => {
  try {
    const referral = await db('referrals').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    const { status, responseNotes } = req.body;
    const validStatuses = ['pending','accepted','completed','cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const patch = {
      updated_at:     new Date(),
      response_notes: responseNotes ?? referral.response_notes,
    };
    if (status)                patch.status        = status;
    if (status === 'accepted') patch.accepted_at   = new Date();
    if (status === 'completed') patch.completed_at = new Date();

    const [updated] = await db('referrals').where({ id: referral.id }).update(patch).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: `referral_${status}`, entity: 'referral', entityId: String(referral.id) });
    return res.json({ referral: updated });
  } catch (err) { next(err); }
});

export default router;
