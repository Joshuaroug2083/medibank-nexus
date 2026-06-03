/**
 * Billing & Payments Routes
 *
 * Public (no auth):
 *   POST /api/v1/billing/paystack-webhook — Paystack event handler (HMAC verified)
 *
 * Authenticated:
 *   GET  /api/v1/billing/subscription      — current plan info
 *   POST /api/v1/billing/subscription/upgrade — upgrade trial → pro (initiates Paystack)
 *   GET  /api/v1/billing/invoices          — list invoices (paginated, filterable)
 *   POST /api/v1/billing/invoices          — create invoice for a visit / service
 *   GET  /api/v1/billing/invoices/:id      — get invoice detail
 *   POST /api/v1/billing/invoices/:id/pay  — record a payment
 *   GET  /api/v1/billing/summary           — revenue summary for analytics
 *   GET  /api/v1/billing/patient/:patientId — all invoices for one patient
 */
import crypto      from 'crypto';
import { Router }  from 'express';
import db          from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }   from '../middleware/rbac.js';
import { audit }   from '../middleware/audit.js';

const router = Router();

/* ── POST /api/v1/billing/paystack-webhook ───────────────────────
   Called by Paystack for every payment event.
   Body arrives as raw Buffer (see index.js raw-body middleware).
   We verify the HMAC-SHA512 signature before processing.
────────────────────────────────────────────────────────────────── */
router.post('/paystack-webhook', async (req, res) => {
  const secret    = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];

  if (!secret || !signature) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  /* Verify HMAC — req.body is a Buffer (raw middleware applied in index.js) */
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  /* ── Handle relevant events ── */
  try {
    if (event.event === 'charge.success') {
      const ref      = event.data?.reference;
      const email    = event.data?.customer?.email;
      const metadata = event.data?.metadata?.custom_fields ?? [];

      const hospitalNameField = metadata.find(f => f.variable_name === 'hospital');
      const hospitalName      = hospitalNameField?.value;

      /* Find hospital by admin email */
      let hospital = null;
      if (email) {
        const adminUser = await db('users').where({ email: email.trim().toLowerCase(), role: 'admin' }).first();
        if (adminUser) {
          hospital = await db('hospitals').where({ id: adminUser.hospital_id }).first();
        }
      }

      /* Fallback: match by name */
      if (!hospital && hospitalName) {
        hospital = await db('hospitals').whereRaw('lower(name) = ?', [hospitalName.toLowerCase()]).first();
      }

      if (hospital) {
        await db('hospitals').where({ id: hospital.id }).update({
          tier:           'pro',
          status:         'active',
          trial_end_date: null,
          updated_at:     new Date(),
        });

        /* Record the subscription payment */
        await db('subscription_payments').insert({
          hospital_id:      hospital.id,
          paystack_ref:     ref,
          amount:           event.data?.amount ?? 0,
          currency:         event.data?.currency ?? 'NGN',
          status:           'success',
          plan:             'pro',
          paystack_payload: JSON.stringify(event.data),
          paid_at:          new Date(),
        }).onConflict('paystack_ref').ignore();

        audit({
          hospitalId: hospital.id,
          action:     'subscription_activated',
          entity:     'hospital',
          entityId:   String(hospital.id),
          meta:       { ref, plan: 'pro' },
        });

        console.log(`[Billing] Hospital "${hospital.name}" activated on Pro plan. Ref: ${ref}`);
      } else {
        console.warn(`[Billing] charge.success received but no hospital matched. Email: ${email}, Ref: ${ref}`);
      }
    }

    if (event.event === 'subscription.disable' || event.event === 'subscription.not_renew') {
      /* Mark hospital as past_due — admin will be notified */
      const ref = event.data?.subscription_code;
      const sub = await db('subscription_payments')
        .where({ paystack_ref: ref })
        .orderBy('paid_at', 'desc')
        .first();

      if (sub) {
        await db('hospitals').where({ id: sub.hospital_id }).update({
          status:     'past_due',
          updated_at: new Date(),
        });
        console.log(`[Billing] Hospital ${sub.hospital_id} subscription lapsed.`);
      }
    }
  } catch (err) {
    console.error('[Billing] Webhook processing error:', err.message);
  }

  /* Always return 200 to Paystack so it doesn't retry */
  return res.sendStatus(200);
});

/* ── All routes below require authentication ─────────────────── */
router.use(authenticate);

/* ── GET /api/v1/billing/subscription ───────────────────────── */
router.get('/subscription', allow('admin'), async (req, res, next) => {
  try {
    const hospital = await db('hospitals').where({ id: req.hospitalId }).first();
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const recentPayment = await db('subscription_payments')
      .where({ hospital_id: req.hospitalId, status: 'success' })
      .orderBy('paid_at', 'desc')
      .first();

    const staffCount = await db('users')
      .where({ hospital_id: req.hospitalId })
      .whereNot({ role: 'patient' })
      .count('id as count')
      .first();

    return res.json({
      subscription: {
        tier:          hospital.tier,
        status:        hospital.status,
        trialEndDate:  hospital.trial_end_date,
        lastPayment:   recentPayment ?? null,
        staffCount:    parseInt(staffCount.count),
      },
    });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/subscription/upgrade ──────────────── */
/* Returns a Paystack payment reference for the frontend to open */
router.post('/subscription/upgrade', allow('admin'), async (req, res, next) => {
  try {
    const hospital = await db('hospitals').where({ id: req.hospitalId }).first();
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    if (hospital.tier === 'pro') {
      return res.status(409).json({ error: 'Hospital is already on the Pro plan' });
    }

    const ref = `NEXUS-UPGRADE-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    return res.json({
      reference:   ref,
      email:       req.user.email,
      amount:      8_000_000,  // ₦80,000 × 100 kobo
      currency:    'NGN',
      paystackKey: process.env.VITE_PAYSTACK_PUBLIC_KEY ?? process.env.PAYSTACK_PUBLIC_KEY,
      metadata: {
        custom_fields: [
          { display_name: 'Hospital',   variable_name: 'hospital',    value: hospital.name },
          { display_name: 'Admin Name', variable_name: 'admin_name',  value: req.user.name },
          { display_name: 'Upgrade',    variable_name: 'upgrade',     value: 'trial_to_pro' },
        ],
      },
    });
  } catch (err) { next(err); }
});

/* ── ID generator  INV-2026-0001 ──────────────────────────── */
async function nextInvoiceId(hospitalId) {
  const year   = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last   = await db('invoices')
    .where({ hospital_id: hospitalId })
    .whereLike('id', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();
  const seq = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/* ── GET /api/v1/billing/invoices ───────────────────────────── */
router.get('/invoices', allow('admin', 'nurse', 'doctor', 'pharmacist'), async (req, res, next) => {
  try {
    const { status, patientId, from, to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let q = db('invoices as inv')
      .join('patients as p', 'p.id', 'inv.patient_id')
      .where('inv.hospital_id', req.hospitalId)
      .select(
        'inv.id', 'inv.status', 'inv.total', 'inv.paid', 'inv.balance',
        'inv.issued_at', 'inv.paid_at', 'inv.notes',
        'p.id as patient_id',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
      );

    if (status)    q = q.where('inv.status', status);
    if (patientId) q = q.where('inv.patient_id', patientId);
    if (from)      q = q.where('inv.issued_at', '>=', from);
    if (to)        q = q.where('inv.issued_at', '<=', to);

    const [{ count }] = await q.clone().count('inv.id as count');
    const invoices    = await q.orderBy('inv.issued_at', 'desc').limit(limit).offset(offset);

    return res.json({ invoices, total: parseInt(count), page: +page, limit: +limit });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/invoices ──────────────────────────── */
router.post('/invoices', allow('admin', 'nurse'), async (req, res, next) => {
  try {
    const { patientId, visitId, items, notes, insuranceProvider, insNumber } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'patientId and items[] are required' });
    }

    const patient = await db('patients').where({ id: patientId, hospital_id: req.hospitalId }).first();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const total   = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const id      = await nextInvoiceId(req.hospitalId);

    const [invoice] = await db('invoices').insert({
      id,
      hospital_id:       req.hospitalId,
      patient_id:        patientId,
      visit_id:          visitId     || null,
      status:            'unpaid',
      total,
      paid:              0,
      balance:           total,
      issued_at:         new Date(),
      notes:             notes || null,
      insurance_provider: insuranceProvider || null,
      ins_number:        insNumber || null,
      created_by:        req.user.id,
    }).returning('*');

    /* Insert line items */
    const lineRows = items.map(i => ({
      invoice_id:   id,
      hospital_id:  req.hospitalId,
      description:  i.description,
      quantity:     Number(i.quantity) || 1,
      unit_price:   Number(i.unitPrice) || Number(i.amount) || 0,
      amount:       Number(i.amount) || 0,
      category:     i.category || 'service',
    }));
    await db('invoice_items').insert(lineRows);

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'create_invoice', entity: 'invoice', entityId: id });

    invoice.items = await db('invoice_items').where({ invoice_id: id });
    return res.status(201).json({ invoice });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/invoices/:id ───────────────────────── */
router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await db('invoices as inv')
      .join('patients as p', 'p.id', 'inv.patient_id')
      .where('inv.id', req.params.id)
      .where('inv.hospital_id', req.hospitalId)
      .select(
        'inv.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.phone as patient_phone',
        'p.insurance as patient_insurance',
      )
      .first();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    invoice.items    = await db('invoice_items').where({ invoice_id: invoice.id });
    invoice.payments = await db('payments').where({ invoice_id: invoice.id }).orderBy('paid_at', 'asc');

    return res.json({ invoice });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/invoices/:id/pay ──────────────────── */
router.post('/invoices/:id/pay', allow('admin', 'nurse'), async (req, res, next) => {
  try {
    const { amount, method, reference, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'amount must be positive' });
    }

    const invoice = await db('invoices').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(409).json({ error: 'Invoice already fully paid' });

    const paying  = Math.min(Number(amount), invoice.balance);
    const newPaid = invoice.paid + paying;
    const newBal  = invoice.total - newPaid;
    const status  = newBal <= 0 ? 'paid' : 'partial';

    await db('invoices').where({ id: invoice.id }).update({
      paid:    newPaid,
      balance: newBal,
      status,
      paid_at: status === 'paid' ? new Date() : null,
    });

    await db('payments').insert({
      invoice_id:  invoice.id,
      hospital_id: req.hospitalId,
      patient_id:  invoice.patient_id,
      amount:      paying,
      method:      method || 'cash',
      reference:   reference || null,
      notes:       notes    || null,
      received_by: req.user.id,
      paid_at:     new Date(),
    });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'record_payment', entity: 'invoice', entityId: invoice.id });

    const updated = await db('invoices').where({ id: invoice.id }).first();
    updated.payments = await db('payments').where({ invoice_id: invoice.id }).orderBy('paid_at', 'asc');

    return res.json({ invoice: updated });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/summary ────────────────────────────── */
router.get('/summary', allow('admin'), async (req, res, next) => {
  try {
    const { from, to } = req.query;

    let q = db('invoices').where({ hospital_id: req.hospitalId });
    if (from) q = q.where('issued_at', '>=', from);
    if (to)   q = q.where('issued_at', '<=', to);

    const [totals] = await q.select(
      db.raw('COALESCE(SUM(total),0) as revenue'),
      db.raw('COALESCE(SUM(paid),0)  as collected'),
      db.raw('COALESCE(SUM(balance),0) as outstanding'),
      db.raw('COUNT(*) as invoice_count'),
      db.raw("COUNT(*) FILTER (WHERE status='paid') as paid_count"),
      db.raw("COUNT(*) FILTER (WHERE status='unpaid') as unpaid_count"),
    );

    return res.json({ summary: totals });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/patient/:patientId ─────────────────── */
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const invoices = await db('invoices')
      .where({ patient_id: req.params.patientId, hospital_id: req.hospitalId })
      .orderBy('issued_at', 'desc');

    for (const inv of invoices) {
      inv.items = await db('invoice_items').where({ invoice_id: inv.id });
    }

    return res.json({ invoices });
  } catch (err) { next(err); }
});

export default router;
