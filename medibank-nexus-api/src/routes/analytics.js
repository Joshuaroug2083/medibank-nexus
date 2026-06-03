import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';

const router = Router();
router.use(authenticate, allow('admin'));

/* ── GET /api/v1/analytics/summary ─────────────────────────── */
router.get('/summary', async (req, res, next) => {
  try {
    const hid = req.hospitalId;

    const [
      patients,
      visits,
      rxPending,
      rxDispensed,
      appointments,
      lowStock,
      staff,
    ] = await Promise.all([
      db('patients').where({ hospital_id: hid }).count('id as n').first(),
      db('visits').where({ hospital_id: hid }).count('id as n').first(),
      db('prescriptions').where({ hospital_id: hid, status: 'pending' }).count('id as n').first(),
      db('prescriptions').where({ hospital_id: hid, status: 'dispensed' }).count('id as n').first(),
      db('appointments').where({ hospital_id: hid }).count('id as n').first(),
      db('medications').where({ hospital_id: hid }).whereRaw('quantity <= reorder_at').count('id as n').first(),
      db('users').where({ hospital_id: hid }).whereNot({ role: 'patient' }).count('id as n').first(),
    ]);

    /* Monthly patient registrations (last 6 months) */
    const monthlyPatients = await db('patients')
      .where({ hospital_id: hid })
      .whereRaw("created_at >= now() - interval '6 months'")
      .select(db.raw("to_char(created_at, 'Mon') as month"), db.raw('count(*) as count'))
      .groupByRaw("to_char(created_at, 'YYYY-MM'), to_char(created_at, 'Mon')")
      .orderByRaw("to_char(created_at, 'YYYY-MM')");

    /* Visits by day (last 7 days) */
    const weeklyVisits = await db('visits')
      .where({ hospital_id: hid })
      .whereRaw("date >= CURRENT_DATE - interval '7 days'")
      .select(db.raw("date::text"), db.raw('count(*) as count'))
      .groupBy('date')
      .orderBy('date');

    /* Role distribution */
    const roleDistribution = await db('users')
      .where({ hospital_id: hid })
      .whereNot({ role: 'patient' })
      .select('role', db.raw('count(*) as count'))
      .groupBy('role');

    return res.json({
      kpis: {
        totalPatients:    parseInt(patients.n),
        totalVisits:      parseInt(visits.n),
        pendingRx:        parseInt(rxPending.n),
        dispensedRx:      parseInt(rxDispensed.n),
        totalAppointments:parseInt(appointments.n),
        lowStockItems:    parseInt(lowStock.n),
        totalStaff:       parseInt(staff.n),
      },
      charts: {
        monthlyPatients,
        weeklyVisits,
        roleDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/analytics/audit-log ──────────────────────────── */
router.get('/audit-log', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await db('audit_log as a')
      .leftJoin('users as u', 'u.id', 'a.user_id')
      .where('a.hospital_id', req.hospitalId)
      .select('a.id','a.action','a.entity','a.entity_id','a.level','a.ip','a.created_at','u.name as user_name','u.role as user_role')
      .orderBy('a.created_at','desc')
      .limit(limit)
      .offset(offset);

    return res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
