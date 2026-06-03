import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── ID generator  PT-2026-0001 ─────────────────────────────── */
async function nextPatientId(hospitalId) {
  const year  = new Date().getFullYear();
  const prefix = `PT-${year}-`;
  const last   = await db('patients')
    .where({ hospital_id: hospitalId })
    .whereLike('id', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();
  const seq = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/* ── GET /api/v1/patients ───────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('patients')
      .where({ hospital_id: req.hospitalId })
      .select(
        'id','first_name','last_name','dob','gender','phone',
        'blood_group','genotype','allergies','conditions','created_at',
      );

    if (q) {
      const term = `%${q.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw("lower(first_name || ' ' || last_name) like ?", [term])
            .orWhereRaw('lower(phone) like ?', [term])
            .orWhereRaw('lower(id) like ?', [term]);
      });
    }

    const [{ count }] = await query.clone().count('id as count');
    const patients = await query.orderBy('created_at','desc').limit(limit).offset(offset);

    return res.json({ patients, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/patients ──────────────────────────────────── */
router.post('/', allow('nurse', 'admin'), async (req, res, next) => {
  try {
    const {
      firstName, lastName, dob, gender, phone, email, nin,
      address, state, bloodGroup, genotype, allergies, conditions, medications,
      insurance, insNumber, ecName, ecPhone, ecRelation,
    } = req.body;

    if (!firstName || !lastName || !dob) {
      return res.status(400).json({ error: 'firstName, lastName and dob are required' });
    }

    const id = await nextPatientId(req.hospitalId);

    const [patient] = await db('patients').insert({
      id,
      hospital_id:    req.hospitalId,
      first_name:     firstName,
      last_name:      lastName,
      dob,
      gender,
      phone,
      email,
      nin,
      address,
      state,
      blood_group:    bloodGroup,
      genotype,
      allergies:      allergies  ?? [],
      conditions:     conditions ?? [],
      medications:    medications ?? [],
      insurance,
      ins_number:     insNumber,
      ec_name:        ecName,
      ec_phone:       ecPhone,
      ec_relation:    ecRelation,
      registered_by:  req.user.id,
    }).returning('*');

    audit({
      userId: req.user.id, hospitalId: req.hospitalId,
      action: 'register_patient', entity: 'patient', entityId: id,
    });

    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/patients/:id ───────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await db('patients')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    /* Last 5 visits */
    const visits = await db('visits')
      .where({ patient_id: req.params.id })
      .orderBy('date', 'desc')
      .limit(5)
      .select('id','date','chief','diagnosis','doctor_id');

    return res.json({ patient, visits });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/patients/:id ───────────────────────────────── */
router.put('/:id', allow('nurse', 'doctor', 'admin'), async (req, res, next) => {
  try {
    const patient = await db('patients')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const allowed = [
      'first_name','last_name','dob','gender','phone','email','address','state',
      'blood_group','genotype','allergies','conditions','medications',
      'insurance','ins_number','ec_name','ec_phone','ec_relation',
    ];
    /* Convert camelCase body keys to snake_case allowed list */
    const keyMap = {
      firstName: 'first_name', lastName: 'last_name', bloodGroup: 'blood_group',
      insNumber: 'ins_number', ecName: 'ec_name', ecPhone: 'ec_phone', ecRelation: 'ec_relation',
    };
    const patch = {};
    for (const [k, v] of Object.entries(req.body)) {
      const col = keyMap[k] ?? k;
      if (allowed.includes(col)) patch[col] = v;
    }

    const [updated] = await db('patients')
      .where({ id: req.params.id })
      .update({ ...patch, updated_at: new Date() })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'update_patient', entity: 'patient', entityId: req.params.id });
    return res.json({ patient: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
