import { Router } from 'express';
import bcrypt      from 'bcrypt';
import jwt         from 'jsonwebtoken';
import db          from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }   from '../middleware/rbac.js';
import { audit }   from '../middleware/audit.js';

const router = Router();

/* ── POST /api/v1/hospitals  (public — hospital self-onboarding) ── */
router.post('/', async (req, res, next) => {
  try {
    const {
      name, shortName, type, licenseNumber,
      address, city, state, phone, email, tier,
      adminName, adminTitle, adminEmail, adminPassword, adminPhone,
    } = req.body;

    /* Basic validation */
    const missing = ['name','shortName','type','licenseNumber','address','city','state',
                     'phone','email','adminName','adminEmail','adminPassword']
      .filter(k => !req.body[k]?.trim?.());
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters' });
    }

    /* Check admin email not already used within any hospital */
    const existing = await db('users').where({ email: adminEmail.toLowerCase() }).first();
    if (existing) {
      return res.status(409).json({ error: 'A user with that admin email already exists' });
    }

    /* Insert hospital */
    const [hospital] = await db('hospitals').insert({
      name,
      short_name:     shortName,
      type,
      tier:           tier ?? 'starter',
      address,
      city,
      state,
      phone,
      email,
      license_number: licenseNumber,
      status:         tier === 'enterprise' ? 'active' : 'trial',
    }).returning('*');

    /* Insert admin user */
    const hashedPw = await bcrypt.hash(adminPassword, 10);
    const initials = adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const [admin] = await db('users').insert({
      hospital_id: hospital.id,
      email:       adminEmail.toLowerCase(),
      password:    hashedPw,
      name:        adminName,
      role:        'admin',
      dept:        adminTitle ?? 'Administration',
    }).returning('*');

    /* Issue JWT so frontend logs in immediately */
    const token = jwt.sign(
      {
        id:         admin.id,
        email:      admin.email,
        role:       admin.role,
        name:       admin.name,
        initials:   initials,
        dept:       admin.dept,
        hospitalId: hospital.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    );

    audit({ userId: admin.id, hospitalId: hospital.id, action: 'hospital_onboarded' });

    return res.status(201).json({
      token,
      hospital: {
        id:           hospital.id,
        name:         hospital.name,
        shortName:    hospital.short_name,
        type:         hospital.type,
        tier:         hospital.tier,
        city:         hospital.city,
        state:        hospital.state,
        primaryColor: hospital.primary_color,
        status:       hospital.status,
      },
      user: { id: admin.id, email: admin.email, role: admin.role, name: admin.name, initials },
    });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/hospitals/:id  (admin of that hospital only) ── */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.hospitalId && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const hospital = await db('hospitals').where({ id: req.params.id }).first();
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    return res.json({ hospital });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/hospitals/:id  (admin only) ─────────────────── */
router.put('/:id', authenticate, allow('admin'), async (req, res, next) => {
  try {
    if (req.params.id !== req.hospitalId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const allowed = ['name','short_name','type','address','city','state','phone','email','primary_color'];
    const patch   = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const [updated] = await db('hospitals')
      .where({ id: req.params.id })
      .update({ ...patch, updated_at: new Date() })
      .returning('*');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'hospital_updated' });
    return res.json({ hospital: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
