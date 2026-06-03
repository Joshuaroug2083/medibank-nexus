/**
 * Laboratory / Investigations Routes
 * GET    /api/v1/lab/orders          — list lab orders (filterable)
 * POST   /api/v1/lab/orders          — create lab order
 * GET    /api/v1/lab/orders/:id      — single order + tests
 * PUT    /api/v1/lab/orders/:id/status — update order status
 * POST   /api/v1/lab/orders/:id/results — record test results
 */
import { Router } from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();
router.use(authenticate);

/* ── generate lab order ID ── */
async function genLabId(hospitalId) {
  const year  = new Date().getFullYear();
  const count = await db('lab_orders')
    .where({ hospital_id: hospitalId })
    .whereRaw("id LIKE ?", [`LAB-${year}-%`])
    .count('id as n').first();
  const seq = String(parseInt(count.n) + 1).padStart(4, '0');
  return `LAB-${year}-${seq}`;
}

/* ── GET /api/v1/lab/orders ── */
router.get('/orders', async (req, res, next) => {
  try {
    const { patientId, visitId, status, priority, q, limit = 50, offset = 0 } = req.query;

    let query = db('lab_orders as lo')
      .join('patients as p', 'lo.patient_id', 'p.id')
      .join('users as u',    'lo.ordered_by',  'u.id')
      .where('lo.hospital_id', req.hospitalId)
      .select(
        'lo.id', 'lo.patient_id', 'lo.visit_id', 'lo.status', 'lo.priority',
        'lo.ordered_at', 'lo.notes', 'lo.updated_at',
        'p.name as patient_name', 'p.phone as patient_phone',
        'u.name as ordered_by_name',
      )
      .orderBy('lo.ordered_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (patientId) query = query.where('lo.patient_id', patientId);
    if (visitId)   query = query.where('lo.visit_id',   visitId);
    if (status)    query = query.where('lo.status',     status);
    if (priority)  query = query.where('lo.priority',   priority);
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('lower(p.name) like ?', [term])
            .orWhereRaw('lower(lo.id) like ?', [term]);
      });
    }

    /* Restrict patient role to own orders */
    if (req.user.role === 'patient') {
      const pt = await db('patients').where({ hospital_id: req.hospitalId, user_id: req.user.id }).first();
      if (pt) query = query.where('lo.patient_id', pt.id);
    }

    const orders = await query;

    /* Attach test list to each order */
    const ids = orders.map(o => o.id);
    const tests = ids.length
      ? await db('lab_tests').whereIn('order_id', ids).orderBy('id')
      : [];
    const testMap = {};
    for (const t of tests) {
      (testMap[t.order_id] ??= []).push(t);
    }

    return res.json({ orders: orders.map(o => ({ ...o, tests: testMap[o.id] ?? [] })) });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/lab/orders ── */
router.post('/orders', allow('doctor', 'nurse'), async (req, res, next) => {
  try {
    const { patientId, visitId, tests, priority = 'routine', notes } = req.body;
    if (!patientId || !Array.isArray(tests) || !tests.length) {
      return res.status(400).json({ error: 'patientId and tests array are required' });
    }
    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const orderId = await genLabId(req.hospitalId);
    await db('lab_orders').insert({
      id:          orderId,
      hospital_id: req.hospitalId,
      patient_id:  patientId,
      visit_id:    visitId ?? null,
      ordered_by:  req.user.id,
      priority,
      notes:       notes ?? null,
    });

    /* Insert individual tests */
    const testRows = tests.map(t => ({
      order_id:  orderId,
      test_name: t.name ?? t.test_name,
      test_code: t.code ?? t.test_code ?? null,
      category:  t.category ?? null,
    }));
    await db('lab_tests').insert(testRows);

    /* Notify patient */
    await db('notifications').insert({
      hospital_id: req.hospitalId,
      user_id:     patient.user_id ?? req.user.id,
      title:       'Lab Tests Ordered',
      body:        `${tests.length} lab test(s) have been ordered for you. Please visit the laboratory.`,
      type:        'lab',
    }).catch(() => {});

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'lab_order_created', entity: 'lab_order', entityId: orderId });
    const created = await db('lab_orders').where({ id: orderId }).first();
    const createdTests = await db('lab_tests').where({ order_id: orderId });
    return res.status(201).json({ order: { ...created, tests: createdTests } });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/lab/orders/:id ── */
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await db('lab_orders as lo')
      .join('patients as p', 'lo.patient_id', 'p.id')
      .join('users as u',    'lo.ordered_by',  'u.id')
      .where('lo.id', req.params.id)
      .where('lo.hospital_id', req.hospitalId)
      .select('lo.*', 'p.name as patient_name', 'u.name as ordered_by_name')
      .first();

    if (!order) return res.status(404).json({ error: 'Lab order not found' });
    const tests = await db('lab_tests').where({ order_id: order.id }).orderBy('id');
    return res.json({ order: { ...order, tests } });
  } catch (err) { next(err); }
});

/* ── PUT /api/v1/lab/orders/:id/status ── */
router.put('/orders/:id/status', allow('nurse', 'doctor', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','collected','processing','completed','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await db('lab_orders').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!order) return res.status(404).json({ error: 'Lab order not found' });

    await db('lab_orders').where({ id: req.params.id }).update({ status, updated_at: new Date() });
    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'lab_status_updated', entity: 'lab_order', entityId: req.params.id });
    return res.json({ ok: true, status });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/lab/orders/:id/results ── */
router.post('/orders/:id/results', allow('nurse', 'doctor', 'admin'), async (req, res, next) => {
  try {
    const { results } = req.body; // [{ testId, result, unit, referenceRange, flag }]
    if (!Array.isArray(results)) return res.status(400).json({ error: 'results array required' });

    const order = await db('lab_orders').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!order) return res.status(404).json({ error: 'Lab order not found' });

    for (const r of results) {
      await db('lab_tests').where({ id: r.testId, order_id: req.params.id }).update({
        result:          r.result,
        unit:            r.unit            ?? null,
        reference_range: r.referenceRange  ?? null,
        flag:            r.flag            ?? null,
        result_at:       new Date(),
        reported_by:     req.user.id,
      });
    }

    /* Mark order as completed if all tests have results */
    const pending = await db('lab_tests').where({ order_id: req.params.id }).whereNull('result').count('id as n').first();
    if (parseInt(pending.n) === 0) {
      await db('lab_orders').where({ id: req.params.id }).update({ status: 'completed', updated_at: new Date() });

      /* Notify ordering doctor */
      await db('notifications').insert({
        hospital_id: req.hospitalId,
        user_id:     order.ordered_by,
        title:       'Lab Results Ready',
        body:        `Lab results for order ${req.params.id} are now available.`,
        type:        'lab',
        action_url:  `lab/${req.params.id}`,
      }).catch(() => {});
    }

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'lab_results_entered', entity: 'lab_order', entityId: req.params.id });
    const updated = await db('lab_tests').where({ order_id: req.params.id }).orderBy('id');
    return res.json({ tests: updated });
  } catch (err) { next(err); }
});

export default router;
