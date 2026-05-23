import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── ID generators ─────────────────────────────────────────── */
async function nextVisitId(hospitalId) {
  const year   = new Date().getFullYear();
  const prefix = `VIS-${year}-`;
  const last   = await db('visits').where({ hospital_id: hospitalId }).whereLike('id', `${prefix}%`).orderBy('id','desc').first();
  const seq    = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4,'0')}`;
}

async function nextRxId(hospitalId) {
  const year   = new Date().getFullYear();
  const prefix = `RX-${year}-`;
  const last   = await db('prescriptions').where({ hospital_id: hospitalId }).whereLike('id', `${prefix}%`).orderBy('id','desc').first();
  const seq    = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4,'0')}`;
}

/* ── GET /api/v1/visits ─────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('visits as v')
      .join('patients as p', 'p.id', 'v.patient_id')
      .join('users as u',    'u.id', 'v.doctor_id')
      .where('v.hospital_id', req.hospitalId)
      .select(
        'v.id','v.date','v.chief','v.diagnosis',
        'p.id as patient_id',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'u.name as doctor_name',
        'v.created_at',
      );

    if (patientId) query = query.where('v.patient_id', patientId);
    if (doctorId)  query = query.where('v.doctor_id',  doctorId);
    if (date)      query = query.where('v.date',        date);

    const [{ count }] = await query.clone().count('v.id as count');
    const visits = await query.orderBy('v.created_at','desc').limit(limit).offset(offset);

    return res.json({ visits, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/visits ────────────────────────────────────── */
router.post('/', allow('doctor'), async (req, res, next) => {
  try {
    const {
      patientId, chief, hpi, diagnosis, plan,
      bp, pulse, temp, spo2, rr, weight,
    } = req.body;

    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    /* Verify patient belongs to same hospital */
    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const id = await nextVisitId(req.hospitalId);

    const [visit] = await db('visits').insert({
      id,
      hospital_id: req.hospitalId,
      patient_id:  patientId,
      doctor_id:   req.user.id,
      date:        new Date(),
      chief, hpi, diagnosis, plan,
      bp, pulse, temp, spo2, rr, weight,
    }).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'create_visit', entity: 'visit', entityId: id });

    return res.status(201).json({ visit });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/visits/:id ─────────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const visit = await db('visits as v')
      .join('patients as p', 'p.id', 'v.patient_id')
      .join('users as u',    'u.id', 'v.doctor_id')
      .where('v.id', req.params.id)
      .where('v.hospital_id', req.hospitalId)
      .select(
        'v.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.blood_group','p.allergies','p.genotype',
        'u.name as doctor_name',
      )
      .first();

    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    /* Prescriptions for this visit */
    const prescriptions = await db('prescriptions as rx')
      .where({ 'rx.visit_id': req.params.id })
      .select('rx.id','rx.status','rx.created_at')
      .orderBy('rx.created_at','desc');

    for (const rx of prescriptions) {
      rx.items = await db('prescription_items').where({ rx_id: rx.id });
    }

    return res.json({ visit, prescriptions });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/visits/:id ─────────────────────────────────── */
router.put('/:id', allow('doctor'), async (req, res, next) => {
  try {
    const visit = await db('visits').where({ id: req.params.id, hospital_id: req.hospitalId, doctor_id: req.user.id }).first();
    if (!visit) return res.status(404).json({ error: 'Visit not found or access denied' });

    const allowed = ['chief','hpi','diagnosis','plan','bp','pulse','temp','spo2','rr','weight'];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const [updated] = await db('visits').where({ id: req.params.id }).update({ ...patch, updated_at: new Date() }).returning('*');
    return res.json({ visit: updated });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/visits/:id/prescriptions ──────────────────── */
router.post('/:id/prescriptions', allow('doctor'), async (req, res, next) => {
  try {
    const visit = await db('visits').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const rxId = await nextRxId(req.hospitalId);

    await db('prescriptions').insert({
      id:          rxId,
      hospital_id: req.hospitalId,
      visit_id:    visit.id,
      patient_id:  visit.patient_id,
      doctor_id:   req.user.id,
      status:      'pending',
    });

    const rows = items.map(i => ({
      rx_id:     rxId,
      drug:      i.drug,
      dose:      i.dose      ?? '',
      frequency: i.frequency ?? '',
      duration:  i.duration  ?? '',
      route:     i.route     ?? 'Oral',
      notes:     i.notes     ?? '',
    }));
    await db('prescription_items').insert(rows);

    const rx = await db('prescriptions').where({ id: rxId }).first();
    rx.items = await db('prescription_items').where({ rx_id: rxId });

    /* Create notification for pharmacist */
    await db('notifications').insert({
      hospital_id: req.hospitalId,
      type:        'new_rx',
      priority:    'high',
      title:       'New Prescription Ready',
      body:        `Rx ${rxId} from Dr. ${req.user.name.split(' ')[0]} is pending dispensing`,
    });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'issue_prescription', entity: 'prescription', entityId: rxId });

    return res.status(201).json({ prescription: rx });
  } catch (err) {
    next(err);
  }
});

export default router;
