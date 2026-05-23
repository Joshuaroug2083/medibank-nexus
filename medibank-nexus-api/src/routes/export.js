/**
 * Data Export Routes — CSV exports for admin
 * GET /api/v1/export/patients      — all patients CSV
 * GET /api/v1/export/invoices      — all invoices CSV
 * GET /api/v1/export/appointments  — appointments CSV
 * GET /api/v1/export/audit-log     — audit log CSV
 */
import { Router } from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(allow('admin'));

/* ── CSV builder ── */
function toCSV(rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const lines  = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...lines].join('\r\n');
}

function csvResponse(res, filename, csv) {
  res.setHeader('Content-Type',        'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control',       'no-store');
  return res.send('\uFEFF' + csv); // UTF-8 BOM for Excel compatibility
}

/* ── GET /patients ── */
router.get('/patients', async (req, res, next) => {
  try {
    const rows = await db('patients')
      .where({ hospital_id: req.hospitalId })
      .orderBy('registered_at', 'desc')
      .select('id','name','dob','gender','phone','email','blood_group','genotype',
              'insurance_provider','insurance_number','state','registered_at');

    const csv = toCSV(rows, [
      { key: 'id',                 label: 'Patient ID'       },
      { key: 'name',               label: 'Full Name'        },
      { key: 'dob',                label: 'Date of Birth'    },
      { key: 'gender',             label: 'Gender'           },
      { key: 'phone',              label: 'Phone'            },
      { key: 'email',              label: 'Email'            },
      { key: 'blood_group',        label: 'Blood Group'      },
      { key: 'genotype',           label: 'Genotype'         },
      { key: 'insurance_provider', label: 'Insurance'        },
      { key: 'insurance_number',   label: 'Insurance No.'    },
      { key: 'state',              label: 'State'            },
      { key: 'registered_at',      label: 'Registered At'    },
    ]);

    return csvResponse(res, `patients-${Date.now()}.csv`, csv);
  } catch (err) { next(err); }
});

/* ── GET /invoices ── */
router.get('/invoices', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = db('invoices as i')
      .join('patients as p', 'i.patient_id', 'p.id')
      .where('i.hospital_id', req.hospitalId)
      .select('i.id','p.name as patient_name','i.status','i.total','i.paid','i.balance',
              'i.created_at','i.updated_at');

    if (from) query = query.where('i.created_at', '>=', from);
    if (to)   query = query.where('i.created_at', '<=', to);
    const rows = await query.orderBy('i.created_at', 'desc');

    const csv = toCSV(rows, [
      { key: 'id',            label: 'Invoice ID'    },
      { key: 'patient_name',  label: 'Patient'       },
      { key: 'status',        label: 'Status'        },
      { key: 'total',         label: 'Total (₦)'     },
      { key: 'paid',          label: 'Paid (₦)'      },
      { key: 'balance',       label: 'Balance (₦)'   },
      { key: 'created_at',    label: 'Created'       },
      { key: 'updated_at',    label: 'Last Updated'  },
    ]);

    return csvResponse(res, `invoices-${Date.now()}.csv`, csv);
  } catch (err) { next(err); }
});

/* ── GET /appointments ── */
router.get('/appointments', async (req, res, next) => {
  try {
    const rows = await db('appointments as a')
      .join('patients as p', 'a.patient_id', 'p.id')
      .join('users as d',    'a.doctor_id',  'd.id')
      .where('a.hospital_id', req.hospitalId)
      .select('a.id','p.name as patient','d.name as doctor','a.scheduled_at',
              'a.status','a.visit_type','a.notes')
      .orderBy('a.scheduled_at', 'desc')
      .limit(5000);

    const csv = toCSV(rows, [
      { key: 'id',           label: 'Appt ID'    },
      { key: 'patient',      label: 'Patient'    },
      { key: 'doctor',       label: 'Doctor'     },
      { key: 'scheduled_at', label: 'Date/Time'  },
      { key: 'visit_type',   label: 'Type'       },
      { key: 'status',       label: 'Status'     },
      { key: 'notes',        label: 'Notes'      },
    ]);

    return csvResponse(res, `appointments-${Date.now()}.csv`, csv);
  } catch (err) { next(err); }
});

/* ── GET /audit-log ── */
router.get('/audit-log', async (req, res, next) => {
  try {
    const rows = await db('audit_logs as al')
      .leftJoin('users as u', 'al.user_id', 'u.id')
      .where('al.hospital_id', req.hospitalId)
      .select('al.id','u.name as user','u.role','al.action','al.entity',
              'al.entity_id','al.ip','al.created_at')
      .orderBy('al.created_at', 'desc')
      .limit(10000);

    const csv = toCSV(rows, [
      { key: 'id',         label: 'Log ID'    },
      { key: 'user',       label: 'User'      },
      { key: 'role',       label: 'Role'      },
      { key: 'action',     label: 'Action'    },
      { key: 'entity',     label: 'Entity'    },
      { key: 'entity_id',  label: 'Entity ID' },
      { key: 'ip',         label: 'IP Address'},
      { key: 'created_at', label: 'Timestamp' },
    ]);

    return csvResponse(res, `audit-log-${Date.now()}.csv`, csv);
  } catch (err) { next(err); }
});

export default router;
