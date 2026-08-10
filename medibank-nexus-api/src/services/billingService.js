import crypto from 'crypto';
import db from '../db.js';
import { audit } from '../middleware/audit.js';
import { decrypt, mask } from '../security/encryption.js';
import { PatientService } from './patientService.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler.js';

export class BillingService {
  static async handlePaystackWebhook(headers, rawBody) {
    const secret    = process.env.PAYSTACK_SECRET_KEY;
    const signature = headers['x-paystack-signature'];

    if (!secret || !signature) {
      throw new ValidationError('Webhook secret not configured');
    }

    const expected = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      throw new ForbiddenError('Invalid webhook signature');
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      throw new ValidationError('Invalid JSON payload');
    }

    try {
      if (event.event === 'charge.success') {
        const ref      = event.data?.reference;
        const email    = event.data?.customer?.email;
        const metadata = event.data?.metadata?.custom_fields ?? [];

        const hospitalNameField = metadata.find(f => f.variable_name === 'hospital');
        const hospitalName      = hospitalNameField?.value;

        let hospital = null;
        if (email) {
          const adminUser = await db('users').where({ email: email.trim().toLowerCase(), role: 'admin' }).first();
          if (adminUser) {
            hospital = await db('hospitals').where({ id: adminUser.hospital_id }).first();
          }
        }

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
  }

  static async getSubscription(hospitalId) {
    const hospital = await db('hospitals').where({ id: hospitalId }).first();
    if (!hospital) throw new NotFoundError('Hospital not found');

    const recentPayment = await db('subscription_payments')
      .where({ hospital_id: hospitalId, status: 'success' })
      .orderBy('paid_at', 'desc')
      .first();

    const staffCount = await db('users')
      .where({ hospital_id: hospitalId })
      .whereNot({ role: 'patient' })
      .count('id as count')
      .first();

    return {
      tier:          hospital.tier,
      status:        hospital.status,
      trialEndDate:  hospital.trial_end_date,
      lastPayment:   recentPayment ?? null,
      staffCount:    parseInt(staffCount.count),
    };
  }

  static async upgradeSubscription(hospitalId, user) {
    const hospital = await db('hospitals').where({ id: hospitalId }).first();
    if (!hospital) throw new NotFoundError('Hospital not found');
    if (hospital.tier === 'pro') {
      throw new ValidationError('Hospital is already on the Pro plan');
    }

    const ref = `NEXUS-UPGRADE-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    return {
      reference:   ref,
      email:       user.email,
      amount:      8_000_000,  // ₦80,000 × 100 kobo
      currency:    'NGN',
      paystackKey: process.env.VITE_PAYSTACK_PUBLIC_KEY ?? process.env.PAYSTACK_PUBLIC_KEY,
      metadata: {
        custom_fields: [
          { display_name: 'Hospital',   variable_name: 'hospital',    value: hospital.name },
          { display_name: 'Admin Name', variable_name: 'admin_name',  value: user.name },
          { display_name: 'Upgrade',    variable_name: 'upgrade',     value: 'trial_to_pro' },
        ],
      },
    };
  }

  static async nextInvoiceId(hospitalId) {
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

  static async listInvoices(hospitalId, { status, patientId, from, to, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    let q = db('invoices as inv')
      .join('patients as p', 'p.id', 'inv.patient_id')
      .where('inv.hospital_id', hospitalId)
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

    return { invoices, total: parseInt(count), page: +page, limit: +limit };
  }

  static async createInvoice(hospitalId, user, body) {
    const { patientId, visitId, items, notes, insuranceProvider, insNumber } = body;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('patientId and items[] are required');
    }

    const patient = await db('patients').where({ id: patientId, hospital_id: hospitalId }).first();
    if (!patient) throw new NotFoundError('Patient not found');

    const total   = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const id      = await this.nextInvoiceId(hospitalId);

    const [invoice] = await db('invoices').insert({
      id,
      hospital_id:       hospitalId,
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
      created_by:        user.id,
    }).returning('*');

    const lineRows = items.map(i => ({
      invoice_id:   id,
      hospital_id:  hospitalId,
      description:  i.description,
      quantity:     Number(i.quantity) || 1,
      unit_price:   Number(i.unitPrice) || Number(i.amount) || 0,
      amount:       Number(i.amount) || 0,
      category:     i.category || 'service',
    }));
    await db('invoice_items').insert(lineRows);

    audit({ userId: user.id, hospitalId, action: 'create_invoice', entity: 'invoice', entityId: id });

    invoice.items = await db('invoice_items').where({ invoice_id: id });
    return invoice;
  }

  static async getInvoiceDetail(invoiceId, hospitalId, user) {
    const invoice = await db('invoices as inv')
      .join('patients as p', 'p.id', 'inv.patient_id')
      .where('inv.id', invoiceId)
      .where('inv.hospital_id', hospitalId)
      .select(
        'inv.*',
        db.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.phone as patient_phone',
        'p.insurance as patient_insurance',
      )
      .first();

    if (!invoice) throw new NotFoundError('Invoice not found');

    if (user.role === 'patient') {
      const ptId = await PatientService.getPatientIdForUser(user.id, user.email, hospitalId);
      if (!ptId || invoice.patient_id !== ptId) {
        throw new ForbiddenError('Access denied');
      }
    }

    if (invoice.patient_phone) {
      const decryptedPhone = decrypt(invoice.patient_phone);
      invoice.patient_phone = user.role === 'pharmacist'
        ? (decryptedPhone ? mask(decryptedPhone.replace(/\s/g,''), 4) : null)
        : decryptedPhone;
    }

    invoice.items    = await db('invoice_items').where({ invoice_id: invoice.id });
    invoice.payments = await db('payments').where({ invoice_id: invoice.id }).orderBy('paid_at', 'asc');

    return invoice;
  }

  static async recordPayment(invoiceId, hospitalId, user, body) {
    const { amount, method, reference, notes } = body;
    if (!amount || Number(amount) <= 0) {
      throw new ValidationError('amount must be positive');
    }

    const invoice = await db('invoices').where({ id: invoiceId, hospital_id: hospitalId }).first();
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'paid') throw new ValidationError('Invoice already fully paid');

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
      hospital_id: hospitalId,
      patient_id:  invoice.patient_id,
      amount:      paying,
      method:      method || 'cash',
      reference:   reference || null,
      notes:       notes    || null,
      received_by: user.id,
      paid_at:     new Date(),
    });

    audit({ userId: user.id, hospitalId, action: 'record_payment', entity: 'invoice', entityId: invoice.id });

    const updated = await db('invoices').where({ id: invoice.id }).first();
    updated.payments = await db('payments').where({ invoice_id: invoice.id }).orderBy('paid_at', 'asc');

    return updated;
  }

  static async getRevenueSummary(hospitalId, { from, to }) {
    let q = db('invoices').where({ hospital_id: hospitalId });
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

    return totals;
  }

  static async getInvoicesForPatient(patientId, hospitalId, user) {
    if (user.role === 'patient') {
      const ptId = await PatientService.getPatientIdForUser(user.id, user.email, hospitalId);
      if (!ptId || patientId !== ptId) {
        throw new ForbiddenError('Access denied');
      }
    }

    const invoices = await db('invoices')
      .where({ patient_id: patientId, hospital_id: hospitalId })
      .orderBy('issued_at', 'desc');

    for (const inv of invoices) {
      inv.items = await db('invoice_items').where({ invoice_id: inv.id });
    }

    return invoices;
  }
}
