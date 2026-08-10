/**
 * Billing & Payments Controller Routes
 */
import { Router }  from 'express';
import authenticate from '../middleware/auth.js';
import { allow }   from '../middleware/rbac.js';
import { BillingService } from '../services/billingService.js';

const router = Router();

/* ── POST /api/v1/billing/paystack-webhook ───────────────────────
   Called by Paystack for every payment event.
   HMAC-SHA512 signature is verified within the Service layer.
────────────────────────────────────────────────────────────────── */
router.post('/paystack-webhook', async (req, res) => {
  try {
    await BillingService.handlePaystackWebhook(req.headers, req.body);
  } catch (err) {
    console.error('[Billing Webhook Error]', err.message);
  }
  /* Always return 200 to Paystack so it doesn't retry */
  return res.sendStatus(200);
});

/* ── All routes below require authentication ─────────────────── */
router.use(authenticate);

/* ── GET /api/v1/billing/subscription ───────────────────────── */
router.get('/subscription', allow('admin'), async (req, res, next) => {
  try {
    const subscription = await BillingService.getSubscription(req.hospitalId);
    return res.json({ subscription });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/subscription/upgrade ──────────────── */
router.post('/subscription/upgrade', allow('admin'), async (req, res, next) => {
  try {
    const upgradeData = await BillingService.upgradeSubscription(req.hospitalId, req.user);
    return res.json(upgradeData);
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/invoices ───────────────────────────── */
router.get('/invoices', allow('admin', 'nurse', 'doctor', 'pharmacist'), async (req, res, next) => {
  try {
    const { status, patientId, from, to, page = 1, limit = 20 } = req.query;
    const result = await BillingService.listInvoices(req.hospitalId, {
      status, patientId, from, to, page: parseInt(page), limit: parseInt(limit)
    });
    return res.json(result);
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/invoices ──────────────────────────── */
router.post('/invoices', allow('admin', 'nurse'), async (req, res, next) => {
  try {
    const invoice = await BillingService.createInvoice(req.hospitalId, req.user, req.body);
    return res.status(201).json({ invoice });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/invoices/:id ───────────────────────── */
router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await BillingService.getInvoiceDetail(req.params.id, req.hospitalId, req.user);
    return res.json({ invoice });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/billing/invoices/:id/pay ──────────────────── */
router.post('/invoices/:id/pay', allow('admin', 'nurse'), async (req, res, next) => {
  try {
    const invoice = await BillingService.recordPayment(req.params.id, req.hospitalId, req.user, req.body);
    return res.json({ invoice });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/summary ────────────────────────────── */
router.get('/summary', allow('admin'), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const summary = await BillingService.getRevenueSummary(req.hospitalId, { from, to });
    return res.json({ summary });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/billing/patient/:patientId ─────────────────── */
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const invoices = await BillingService.getInvoicesForPatient(req.params.patientId, req.hospitalId, req.user);
    return res.json({ invoices });
  } catch (err) { next(err); }
});

export default router;
