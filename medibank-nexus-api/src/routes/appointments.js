import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── ID generator ────────────────────────────────────────────── */
async function nextApptId(hospitalId) {
  const year   = new Date().getFullYear();
  const prefix = `APT-${year}-`;
  const last   = await db('appointments').where({ hospital_id: hospitalId }).whereLike('id', `${prefix}%`).orderBy('id','desc').first();
  const seq    = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4,'0')}`;
}

/* ── GET /api/v1/appointments ───────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { date, doctorId, patientId, status, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('appointments as a')
      .join('patients as p', 'p.id', 'a.patient_id')
      .join('users as dr',   'dr.id', 'a.doctor_id')
      .where('a.hospital_id', req.hospitalId)
      .select(
        'a.id','a.date','a.time','a.type','a.status','a.notes','a.reminder','a.created_at',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.id as patient_id','p.phone as patient_phone',
        'dr.name as doctor_name','dr.id as doctor_id',
      );

    if (date)      query = query.where('a.date',      date);
    if (doctorId)  query = query.where('a.doctor_id',  doctorId);
    if (patientId) query = query.where('a.patient_id', patientId);
    if (status)    query = query.where('a.status',     status);

    /* Patients can only see their own appointments */
    if (req.user.role === 'patient') {
      const patient = await db('patients')
        .where({ email: req.user.email, hospital_id: req.hospitalId })
        .first();
      if (patient) query = query.where('a.patient_id', patient.id);
    }

    /* Doctors only see their own schedule */
    if (req.user.role === 'doctor') {
      query = query.where('a.doctor_id', req.user.id);
    }

    const [{ count }] = await query.clone().count('a.id as count');
    const appointments = await query.orderBy('a.date','asc').orderBy('a.time','asc').limit(limit).offset(offset);

    return res.json({ appointments, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/appointments ──────────────────────────────── */
router.post('/', allow('nurse','admin','doctor'), async (req, res, next) => {
  try {
    const { patientId, doctorId, type, date, time, notes, reminder } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ error: 'patientId, doctorId, date and time are required' });
    }

    /* Verify patient & doctor belong to hospital */
    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const doctor = await db('users').where({ id: doctorId, hospital_id: req.hospitalId, role: 'doctor' }).first();
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const id = await nextApptId(req.hospitalId);

    const [appt] = await db('appointments').insert({
      id,
      hospital_id: req.hospitalId,
      patient_id:  patientId,
      doctor_id:   doctorId,
      type,
      date,
      time,
      notes,
      reminder:    reminder ?? 'sms',
      status:      'pending',
    }).returning('*');

    /* Notification to doctor */
    await db('notifications').insert({
      hospital_id: req.hospitalId,
      user_id:     doctorId,
      type:        'new_appointment',
      priority:    'medium',
      title:       'New Appointment Scheduled',
      body:        `${patient.first_name} ${patient.last_name} on ${date} at ${time}`,
    });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'book_appointment', entity: 'appointment', entityId: id });

    return res.status(201).json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/appointments/:id ───────────────────────────── */
router.put('/:id', allow('nurse','admin','doctor'), async (req, res, next) => {
  try {
    const appt = await db('appointments').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const allowed = ['status','date','time','notes','type','reminder'];
    const patch   = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const [updated] = await db('appointments')
      .where({ id: req.params.id })
      .update({ ...patch, updated_at: new Date() })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'update_appointment', entity: 'appointment', entityId: req.params.id });
    return res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/v1/appointments/:id ────────────────────────── */
router.delete('/:id', allow('nurse','admin'), async (req, res, next) => {
  try {
    const appt = await db('appointments').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    await db('appointments').where({ id: req.params.id }).update({ status: 'cancelled', updated_at: new Date() });
    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'cancel_appointment', entity: 'appointment', entityId: req.params.id });
    return res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    next(err);
  }
});

export default router;
