/**
 * Inpatient / Bed Management Routes
 *
 *   GET  /api/v1/inpatient/wards              — list wards (+ bed availability)
 *   POST /api/v1/inpatient/wards              — create ward (admin)
 *   GET  /api/v1/inpatient/wards/:id/beds     — list beds in a ward
 *   POST /api/v1/inpatient/wards/:id/beds     — add bed(s) to ward (admin)
 *   GET  /api/v1/inpatient/admissions         — active admissions (with bed + patient info)
 *   POST /api/v1/inpatient/admissions         — admit patient to a bed
 *   GET  /api/v1/inpatient/admissions/:id     — single admission detail
 *   PUT  /api/v1/inpatient/admissions/:id     — update admission (attending doctor, diagnosis)
 *   POST /api/v1/inpatient/admissions/:id/discharge — discharge patient
 *   GET  /api/v1/inpatient/nursing-notes      — list notes (filter by patient/admission)
 *   POST /api/v1/inpatient/nursing-notes      — add nursing note / vital signs
 *   GET  /api/v1/inpatient/mar                — MAR records for an admission
 *   POST /api/v1/inpatient/mar                — schedule a medication
 *   PUT  /api/v1/inpatient/mar/:id/administer — record administration
 */
import { Router }   from 'express';
import db            from '../db.js';
import authenticate  from '../middleware/auth.js';
import { allow }     from '../middleware/rbac.js';
import { audit }     from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ══════════════════════════════════════
   WARDS
══════════════════════════════════════ */

router.get('/wards', async (req, res, next) => {
  try {
    const wards = await db('wards')
      .where({ hospital_id: req.hospitalId, status: 'active' })
      .orderBy('name');

    /* Attach bed stats */
    for (const w of wards) {
      const [stats] = await db('beds')
        .where({ ward_id: w.id })
        .select(
          db.raw('COUNT(*) as total'),
          db.raw("COUNT(*) FILTER (WHERE status='available') as available"),
          db.raw("COUNT(*) FILTER (WHERE status='occupied')  as occupied"),
        );
      w.beds = stats;
    }

    return res.json({ wards });
  } catch (err) { next(err); }
});

router.post('/wards', allow('admin'), async (req, res, next) => {
  try {
    const { name, ward_type, total_beds, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const [ward] = await db('wards').insert({
      hospital_id: req.hospitalId,
      name,
      ward_type:   ward_type ?? 'general',
      total_beds:  total_beds ?? 0,
      notes:       notes ?? null,
      created_at:  new Date(),
      updated_at:  new Date(),
    }).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'ward_created', entity: 'ward', entityId: String(ward.id) });
    return res.status(201).json({ ward });
  } catch (err) { next(err); }
});

router.get('/wards/:id/beds', async (req, res, next) => {
  try {
    const ward = await db('wards').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!ward) return res.status(404).json({ error: 'Ward not found' });

    const beds = await db('beds as b')
      .leftJoin('admissions as a', function() {
        this.on('a.bed_id', 'b.id').andOn('a.status', db.raw("'admitted'"));
      })
      .leftJoin('patients as p', 'p.id', 'a.patient_id')
      .where('b.ward_id', req.params.id)
      .select(
        'b.*',
        'a.id as admission_id',
        'a.admitted_at',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.id as patient_id',
      )
      .orderBy('b.bed_number');

    return res.json({ ward, beds });
  } catch (err) { next(err); }
});

router.post('/wards/:id/beds', allow('admin'), async (req, res, next) => {
  try {
    const ward = await db('wards').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!ward) return res.status(404).json({ error: 'Ward not found' });

    const { beds: bedList } = req.body; // [{ bed_number, bed_type }] or { from, to }
    let toInsert = [];

    if (Array.isArray(bedList)) {
      toInsert = bedList.map(b => ({
        hospital_id: req.hospitalId,
        ward_id:     ward.id,
        bed_number:  String(b.bed_number),
        bed_type:    b.bed_type ?? 'standard',
        status:      'available',
        created_at:  new Date(),
      }));
    } else if (req.body.from && req.body.to) {
      for (let i = parseInt(req.body.from); i <= parseInt(req.body.to); i++) {
        toInsert.push({
          hospital_id: req.hospitalId,
          ward_id:     ward.id,
          bed_number:  String(i),
          bed_type:    req.body.bed_type ?? 'standard',
          status:      'available',
          created_at:  new Date(),
        });
      }
    } else {
      return res.status(400).json({ error: 'Provide beds[] array or from/to range' });
    }

    const created = await db('beds').insert(toInsert).onConflict(['ward_id','bed_number']).ignore().returning('*');
    return res.status(201).json({ beds: created, count: created.length });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════
   ADMISSIONS
══════════════════════════════════════ */

router.get('/admissions', async (req, res, next) => {
  try {
    const { status = 'admitted', wardId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let q = db('admissions as a')
      .join('patients as p', 'p.id', 'a.patient_id')
      .leftJoin('beds as b',  'b.id', 'a.bed_id')
      .leftJoin('wards as w', 'w.id', 'a.ward_id')
      .leftJoin('users as d',  'd.id', 'a.attending_doctor')
      .where('a.hospital_id', req.hospitalId)
      .select(
        'a.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.date_of_birth', 'p.gender', 'p.phone as patient_phone',
        'b.bed_number', 'w.name as ward_name',
        'd.name as doctor_name',
      );

    if (status) q = q.where('a.status', status);
    if (wardId) q = q.where('a.ward_id', wardId);

    const [{ count }] = await q.clone().count('a.id as count');
    const admissions  = await q.orderBy('a.admitted_at', 'desc').limit(limit).offset(offset);

    return res.json({ admissions, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) { next(err); }
});

router.post('/admissions', allow('admin','nurse','doctor'), async (req, res, next) => {
  try {
    const { patientId, bedId, wardId, diagnosis, attendingDoctorId, visitId } = req.body;
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    /* Check bed is available */
    if (bedId) {
      const bed = await db('beds').where({ id: bedId, hospital_id: req.hospitalId }).first();
      if (!bed) return res.status(404).json({ error: 'Bed not found' });
      if (bed.status !== 'available') return res.status(409).json({ error: `Bed ${bed.bed_number} is ${bed.status}` });
      await db('beds').where({ id: bedId }).update({ status: 'occupied' });
    }

    const [admission] = await db('admissions').insert({
      hospital_id:      req.hospitalId,
      patient_id:       patientId,
      bed_id:           bedId    ?? null,
      ward_id:          wardId   ?? null,
      visit_id:         visitId  ?? null,
      admitted_by:      req.user.id,
      attending_doctor: attendingDoctorId ?? null,
      diagnosis:        diagnosis ?? null,
      status:           'admitted',
      admitted_at:      new Date(),
      created_at:       new Date(),
      updated_at:       new Date(),
    }).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'patient_admitted', entity: 'admission', entityId: String(admission.id) });
    return res.status(201).json({ admission });
  } catch (err) { next(err); }
});

router.get('/admissions/:id', async (req, res, next) => {
  try {
    const admission = await db('admissions as a')
      .join('patients as p', 'p.id', 'a.patient_id')
      .leftJoin('beds as b',  'b.id', 'a.bed_id')
      .leftJoin('wards as w', 'w.id', 'a.ward_id')
      .leftJoin('users as d',  'd.id', 'a.attending_doctor')
      .where('a.id', req.params.id)
      .where('a.hospital_id', req.hospitalId)
      .select(
        'a.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.date_of_birth', 'p.gender', 'p.phone as patient_phone', 'p.blood_group',
        'b.bed_number', 'w.name as ward_name',
        'd.name as doctor_name',
      )
      .first();

    if (!admission) return res.status(404).json({ error: 'Admission not found' });

    admission.nursing_notes = await db('nursing_notes as n')
      .join('users as u', 'u.id', 'n.nurse_id')
      .where({ 'n.admission_id': admission.id })
      .select('n.*', 'u.name as nurse_name')
      .orderBy('n.created_at', 'desc')
      .limit(20);

    admission.mar = await db('mar_records as m')
      .leftJoin('users as u', 'u.id', 'm.administered_by')
      .where({ 'm.admission_id': admission.id })
      .select('m.*', 'u.name as administered_by_name')
      .orderBy('m.scheduled_at', 'asc');

    return res.json({ admission });
  } catch (err) { next(err); }
});

router.put('/admissions/:id', allow('admin','doctor','nurse'), async (req, res, next) => {
  try {
    const allowed = ['attending_doctor','diagnosis','ward_id','bed_id'];
    const patch   = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const [updated] = await db('admissions')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({ ...patch, updated_at: new Date() })
      .returning('*');

    if (!updated) return res.status(404).json({ error: 'Admission not found' });
    return res.json({ admission: updated });
  } catch (err) { next(err); }
});

router.post('/admissions/:id/discharge', allow('admin','doctor','nurse'), async (req, res, next) => {
  try {
    const { dischargeNotes } = req.body;
    const admission = await db('admissions')
      .where({ id: req.params.id, hospital_id: req.hospitalId, status: 'admitted' })
      .first();

    if (!admission) return res.status(404).json({ error: 'Active admission not found' });

    /* Free the bed */
    if (admission.bed_id) {
      await db('beds').where({ id: admission.bed_id }).update({ status: 'available' });
    }

    const [updated] = await db('admissions')
      .where({ id: admission.id })
      .update({
        status:         'discharged',
        discharged_at:  new Date(),
        discharge_notes: dischargeNotes ?? null,
        updated_at:     new Date(),
      })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'patient_discharged', entity: 'admission', entityId: String(admission.id) });
    return res.json({ admission: updated });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════
   NURSING NOTES
══════════════════════════════════════ */

router.get('/nursing-notes', allow('admin','nurse','doctor'), async (req, res, next) => {
  try {
    const { patientId, admissionId, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let q = db('nursing_notes as n')
      .join('users as u', 'u.id', 'n.nurse_id')
      .where('n.hospital_id', req.hospitalId)
      .select('n.*', 'u.name as nurse_name');

    if (patientId)   q = q.where('n.patient_id', patientId);
    if (admissionId) q = q.where('n.admission_id', admissionId);

    const notes = await q.orderBy('n.created_at', 'desc').limit(limit).offset(offset);
    return res.json({ notes });
  } catch (err) { next(err); }
});

router.post('/nursing-notes', allow('admin','nurse','doctor'), async (req, res, next) => {
  try {
    const { patientId, admissionId, visitId, noteType, content, vitals } = req.body;
    if (!patientId || !content) return res.status(400).json({ error: 'patientId and content are required' });

    const [note] = await db('nursing_notes').insert({
      hospital_id:  req.hospitalId,
      patient_id:   patientId,
      admission_id: admissionId ?? null,
      visit_id:     visitId     ?? null,
      nurse_id:     req.user.id,
      note_type:    noteType ?? 'general',
      content,
      vitals:       vitals ? JSON.stringify(vitals) : null,
      created_at:   new Date(),
    }).returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'nursing_note_added', entity: 'nursing_note', entityId: String(note.id) });
    return res.status(201).json({ note });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════
   MEDICATION ADMINISTRATION RECORD (MAR)
══════════════════════════════════════ */

router.get('/mar', allow('admin','nurse','doctor','pharmacist'), async (req, res, next) => {
  try {
    const { admissionId, patientId } = req.query;
    if (!admissionId && !patientId) return res.status(400).json({ error: 'admissionId or patientId is required' });

    let q = db('mar_records as m')
      .leftJoin('users as u', 'u.id', 'm.administered_by')
      .where('m.hospital_id', req.hospitalId)
      .select('m.*', 'u.name as administered_by_name');

    if (admissionId) q = q.where('m.admission_id', admissionId);
    if (patientId)   q = q.where('m.patient_id', patientId);

    const records = await q.orderBy('m.scheduled_at', 'asc');
    return res.json({ records });
  } catch (err) { next(err); }
});

router.post('/mar', allow('admin','nurse','doctor','pharmacist'), async (req, res, next) => {
  try {
    const { patientId, admissionId, drugName, dose, route, frequency, scheduledAt } = req.body;
    if (!patientId || !drugName || !dose || !scheduledAt) {
      return res.status(400).json({ error: 'patientId, drugName, dose and scheduledAt are required' });
    }

    const [record] = await db('mar_records').insert({
      hospital_id:  req.hospitalId,
      patient_id:   patientId,
      admission_id: admissionId ?? null,
      drug_name:    drugName,
      dose,
      route:        route ?? 'oral',
      frequency:    frequency ?? 'once',
      scheduled_at: new Date(scheduledAt),
      status:       'scheduled',
      created_at:   new Date(),
    }).returning('*');

    return res.status(201).json({ record });
  } catch (err) { next(err); }
});

router.put('/mar/:id/administer', allow('admin','nurse'), async (req, res, next) => {
  try {
    const { status, omissionReason, notes } = req.body;
    const valid = ['given','omitted','refused','held'];
    if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });

    const [record] = await db('mar_records')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({
        status,
        administered_at: status === 'given' ? new Date() : null,
        administered_by: status === 'given' ? req.user.id : null,
        omission_reason: omissionReason ?? null,
        notes:           notes ?? null,
      })
      .returning('*');

    if (!record) return res.status(404).json({ error: 'MAR record not found' });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'mar_administered', entity: 'mar', entityId: String(record.id), meta: { status } });
    return res.json({ record });
  } catch (err) { next(err); }
});

export default router;
