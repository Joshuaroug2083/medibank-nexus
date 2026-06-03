import crypto       from 'crypto';
import { Router }  from 'express';
import bcrypt       from 'bcrypt';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { audit }    from '../middleware/audit.js';

const router = Router();

/* All staff routes require authentication ────────────────────── */
router.use(authenticate);

/* ── GET /api/v1/staff  ────────────────────────────────────────── */
/* Admin: all staff. Other roles: only doctors (for appointment booking). */
router.get('/', async (req, res, next) => {
  try {
    const { role, status, q } = req.query;

    /* Non-admin users can only list doctors (for appointment booking UI) */
    if (req.user.role !== 'admin') {
      const doctors = await db('users')
        .where({ hospital_id: req.hospitalId, role: 'doctor', status: 'active' })
        .select('id','name','dept','role');
      return res.json({ staff: doctors });
    }

    let query = db('users')
      .where({ hospital_id: req.hospitalId })
      .whereNot({ role: 'patient' })           // patients managed separately
      .select('id','email','name','initials','role','dept','status','created_at');

    if (role)   query = query.where({ role });
    if (status) query = query.where({ status });
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('lower(name) like ?', [term])
            .orWhereRaw('lower(email) like ?', [term])
            .orWhereRaw('lower(dept) like ?', [term]);
      });
    }

    const staff = await query.orderBy('name');
    return res.json({ staff });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/staff  ──────────────────────────────────────── */
router.post('/', allow('admin'), async (req, res, next) => {
  try {
    const { name, email, role, dept, phone } = req.body;

    /* Validate role */
    const validRoles = ['nurse','doctor','pharmacist','admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    /* Check plan staff limit */
    const hospital   = await db('hospitals').where({ id: req.hospitalId }).first();
    const LIMITS     = { free_trial: 5, pro: 30, custom: null, starter: 10, professional: 50, enterprise: null };
    const limit      = LIMITS[hospital.tier] ?? null;
    if (limit !== null) {
      const count = await db('users').where({ hospital_id: req.hospitalId }).whereNot({ role: 'patient' }).count('id as n').first();
      if (parseInt(count.n) >= limit) {
        return res.status(403).json({
          error: `Your ${hospital.tier} plan allows a maximum of ${limit} staff accounts. Upgrade to add more.`,
        });
      }
    }

    /* Check email uniqueness within hospital */
    const exists = await db('users').where({ hospital_id: req.hospitalId, email: email.toLowerCase() }).first();
    if (exists) {
      return res.status(409).json({ error: 'A staff member with that email already exists' });
    }

    /* Default temporary password */
    const tempPassword = 'Welcome@123';
    const hashed       = await bcrypt.hash(tempPassword, 10);

    const [member] = await db('users').insert({
      hospital_id: req.hospitalId,
      email:       email.toLowerCase(),
      password:    hashed,
      name,
      role,
      dept: dept ?? '',
    }).returning('id','email','name','initials','role','dept','status','created_at');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'staff_added', entity: 'user', entityId: member.id });

    return res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/staff/:id  ────────────────────────────────────── */
router.put('/:id', allow('admin'), async (req, res, next) => {
  try {
    /* Ensure target staff belongs to same hospital */
    const member = await db('users').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    const allowed = ['name','dept','status'];
    const patch   = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const [updated] = await db('users')
      .where({ id: req.params.id })
      .update({ ...patch, updated_at: new Date() })
      .returning('id','email','name','initials','role','dept','status');

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'staff_updated', entity: 'user', entityId: req.params.id });
    return res.json({ member: updated });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/v1/staff/:id  ─────────────────────────────────── */
router.delete('/:id', allow('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove your own account' });
    }
    const member = await db('users').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    /* Soft-delete: suspend rather than hard delete to preserve audit refs */
    await db('users').where({ id: req.params.id }).update({ status: 'suspended', updated_at: new Date() });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'staff_removed', entity: 'user', entityId: req.params.id });
    return res.json({ message: 'Staff member suspended successfully' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/staff/:id/reset-password  ─────────────────────── */
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const member = await db('users').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    const tempPassword = 'Welcome@123';
    const hashed       = await bcrypt.hash(tempPassword, 10);
    await db('users').where({ id: req.params.id }).update({ password: hashed, updated_at: new Date() });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'staff_password_reset', entity: 'user', entityId: req.params.id });
    return res.json({ message: `Password reset. Temporary password: ${tempPassword}` });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/staff/invite  ─────────────────────────────────── */
/* Admin sends an email invitation; staff accepts via token link.    */
router.post('/invite', allow('admin'), async (req, res, next) => {
  try {
    const { email, role, dept } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'email and role are required' });

    const validRoles = ['nurse','doctor','pharmacist','admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    /* Check if already a staff member */
    const existing = await db('users').where({ hospital_id: req.hospitalId, email: email.toLowerCase() }).first();
    if (existing) return res.status(409).json({ error: 'A staff member with that email already exists' });

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const hospital = await db('hospitals').where({ id: req.hospitalId }).first();

    await db('staff_invitations')
      .insert({
        hospital_id:  req.hospitalId,
        email:        email.toLowerCase(),
        role,
        dept:         dept ?? null,
        token_hash:   hashedToken,
        invited_by:   req.user.id,
        expires_at:   expiresAt,
        created_at:   new Date(),
      })
      .onConflict(['hospital_id','email'])
      .merge(['role','dept','token_hash','invited_by','expires_at','created_at']);

    /* Send invitation email if SMTP is configured */
    const inviteUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/accept-invite?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}&hospital=${encodeURIComponent(hospital.name)}`;

    try {
      const { sendEmail } = await import('../services/email.js');
      await sendEmail({
        to:      email,
        subject: `You've been invited to join ${hospital.name} on MediBank Nexus`,
        html:    `
          <p>Hi,</p>
          <p>You've been invited to join <strong>${hospital.name}</strong> as a <strong>${role}</strong> on MediBank Nexus.</p>
          <p><a href="${inviteUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Accept Invitation</a></p>
          <p>This link expires in 7 days.</p>
          <p>If you didn't expect this invitation, you can ignore this email.</p>
        `,
      });
    } catch {
      /* Email not fatal — return token in dev mode */
    }

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'staff_invited', entity: 'invitation', meta: { email, role } });

    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(201).json({
      message:  `Invitation sent to ${email}`,
      ...(isDev ? { devToken: rawToken, inviteUrl } : {}),
    });
  } catch (err) { next(err); }
});

/* ── POST /api/v1/staff/accept-invite  ───────────────────────────── */
/* Public endpoint — no auth required */
router.post('/accept-invite', async (req, res, next) => {
  try {
    const { email, token, name, password } = req.body;
    if (!email || !token || !name || !password) {
      return res.status(400).json({ error: 'email, token, name and password are required' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const normalEmail = email.trim().toLowerCase();
    const invitations = await db('staff_invitations')
      .where({ email: normalEmail, accepted_at: null })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');

    let matchedInv = null;
    for (const inv of invitations) {
      if (await bcrypt.compare(token, inv.token_hash)) {
        matchedInv = inv;
        break;
      }
    }

    if (!matchedInv) return res.status(400).json({ error: 'Invalid or expired invitation' });

    /* Check email not already used */
    const alreadyExists = await db('users').where({ hospital_id: matchedInv.hospital_id, email: normalEmail }).first();
    if (alreadyExists) return res.status(409).json({ error: 'An account with this email already exists' });

    const hashed  = await bcrypt.hash(password, 12);
    const initials = name.split(' ').map(p => p[0]?.toUpperCase()).join('').slice(0, 2);

    const [user] = await db('users').insert({
      hospital_id: matchedInv.hospital_id,
      email:       normalEmail,
      password:    hashed,
      name,
      initials,
      role:        matchedInv.role,
      dept:        matchedInv.dept ?? '',
      status:      'active',
      created_at:  new Date(),
    }).returning('id','email','name','role','dept','status');

    await db('staff_invitations').where({ id: matchedInv.id }).update({ accepted_at: new Date() });

    audit({ userId: user.id, hospitalId: matchedInv.hospital_id, action: 'invitation_accepted', entity: 'user', entityId: user.id });

    return res.status(201).json({ message: 'Account created successfully. You can now sign in.', user });
  } catch (err) { next(err); }
});

/* ── GET /api/v1/staff/invitations  ─────────────────────────────── */
router.get('/invitations', allow('admin'), async (req, res, next) => {
  try {
    const invitations = await db('staff_invitations as si')
      .leftJoin('users as u', 'u.id', 'si.invited_by')
      .where('si.hospital_id', req.hospitalId)
      .select(
        'si.id', 'si.email', 'si.role', 'si.dept',
        'si.expires_at', 'si.accepted_at', 'si.created_at',
        'u.name as invited_by_name',
      )
      .orderBy('si.created_at', 'desc');

    return res.json({ invitations });
  } catch (err) { next(err); }
});

export default router;
