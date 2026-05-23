import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── GET /api/v1/pharmacy/queue ─────────────────────────────── */
router.get('/queue', allow('pharmacist','admin'), async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const rxList = await db('prescriptions as rx')
      .join('patients as p',  'p.id', 'rx.patient_id')
      .join('users as dr',    'dr.id', 'rx.doctor_id')
      .where('rx.hospital_id', req.hospitalId)
      .where('rx.status', status)
      .select(
        'rx.id','rx.status','rx.created_at',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.id as patient_id',
        'dr.name as doctor_name',
      )
      .orderBy('rx.created_at', 'asc');

    /* Attach items to each Rx */
    for (const rx of rxList) {
      rx.items = await db('prescription_items').where({ rx_id: rx.id });
    }

    return res.json({ queue: rxList });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/pharmacy/dispense/:rxId ────────────────────── */
router.put('/dispense/:rxId', allow('pharmacist'), async (req, res, next) => {
  try {
    const rx = await db('prescriptions')
      .where({ id: req.params.rxId, hospital_id: req.hospitalId })
      .first();

    if (!rx)                       return res.status(404).json({ error: 'Prescription not found' });
    if (rx.status !== 'pending')   return res.status(400).json({ error: `Prescription is already ${rx.status}` });

    /* Deduct medication stock for each item */
    const items = await db('prescription_items').where({ rx_id: rx.id });
    for (const item of items) {
      await db('medications')
        .where({ hospital_id: req.hospitalId, name: item.drug })
        .decrement('quantity', 1)
        .whereRaw('quantity > 0');   // never go below 0
    }

    const [updated] = await db('prescriptions')
      .where({ id: req.params.rxId })
      .update({
        status:       'dispensed',
        dispensed_by: req.user.id,
        dispensed_at: new Date(),
        updated_at:   new Date(),
      })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'dispense_rx', entity: 'prescription', entityId: rx.id });

    return res.json({ prescription: updated });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/pharmacy/inventory ─────────────────────────── */
router.get('/inventory', allow('pharmacist','admin'), async (req, res, next) => {
  try {
    const meds = await db('medications')
      .where({ hospital_id: req.hospitalId })
      .orderBy('name');

    /* Tag low-stock items */
    const inventory = meds.map(m => ({
      ...m,
      low_stock: m.quantity <= m.reorder_at,
    }));

    return res.json({ inventory });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/pharmacy/inventory/:id ─────────────────────── */
router.put('/inventory/:id', allow('pharmacist','admin'), async (req, res, next) => {
  try {
    const med = await db('medications')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .first();
    if (!med) return res.status(404).json({ error: 'Medication not found' });

    const { quantity, reorder_at } = req.body;
    const patch = {};
    if (quantity   !== undefined) patch.quantity   = parseInt(quantity);
    if (reorder_at !== undefined) patch.reorder_at = parseInt(reorder_at);

    const [updated] = await db('medications')
      .where({ id: req.params.id })
      .update({ ...patch, updated_at: new Date() })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'update_inventory', entity: 'medication', entityId: req.params.id });
    return res.json({ medication: updated });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/pharmacy/inventory  (add new drug) ─────────── */
router.post('/inventory', allow('pharmacist','admin'), async (req, res, next) => {
  try {
    const { name, unit, quantity, reorder_at } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const exists = await db('medications').where({ hospital_id: req.hospitalId, name }).first();
    if (exists) return res.status(409).json({ error: 'Medication already exists' });

    const [med] = await db('medications').insert({
      hospital_id: req.hospitalId,
      name,
      unit:       unit       ?? 'units',
      quantity:   quantity   ?? 0,
      reorder_at: reorder_at ?? 30,
    }).returning('*');

    return res.status(201).json({ medication: med });
  } catch (err) {
    next(err);
  }
});

export default router;
