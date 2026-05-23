/**
 * Drug Formulary Routes — /api/v1/formulary
 * Admin manages the hospital drug catalog (CRUD).
 * Pharmacists and doctors can read; only admins can write.
 */
import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import db           from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { allow }        from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

/* ── helpers ── */
const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ error: errs.array()[0].msg });
  next();
};

/* ════════════════════════════════════════════════
   GET /api/v1/formulary  — list drugs
════════════════════════════════════════════════ */
router.get('/',
  allow('admin', 'pharmacist', 'doctor', 'nurse'),
  [
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('q').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { limit = 200, q, category, status = 'active' } = req.query;
      const { hospitalId } = req;

      let qb = db('formulary')
        .where('hospital_id', hospitalId)
        .orderBy('name');

      if (status) qb = qb.where('status', status);
      if (category) qb = qb.where('category', category);
      if (q) {
        const s = `%${q}%`;
        qb = qb.where(function () {
          this.whereILike('name', s).orWhereILike('generic', s);
        });
      }

      const drugs = await qb.limit(limit);
      res.json({ drugs });
    } catch (err) { next(err); }
  },
);

/* ════════════════════════════════════════════════
   GET /api/v1/formulary/:id  — single drug
════════════════════════════════════════════════ */
router.get('/:id',
  allow('admin', 'pharmacist', 'doctor', 'nurse'),
  async (req, res, next) => {
    try {
      const drug = await db('formulary')
        .where({ id: req.params.id, hospital_id: req.hospitalId })
        .first();
      if (!drug) return res.status(404).json({ error: 'Drug not found' });
      res.json({ drug });
    } catch (err) { next(err); }
  },
);

/* ════════════════════════════════════════════════
   POST /api/v1/formulary  — add drug
════════════════════════════════════════════════ */
router.post('/',
  allow('admin', 'pharmacist'),
  [
    body('name').trim().notEmpty().withMessage('Drug name is required').isLength({ max: 200 }),
    body('generic').optional().trim().isLength({ max: 200 }),
    body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }),
    body('unit').trim().notEmpty().withMessage('Unit is required').isLength({ max: 50 }),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number').toFloat(),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer').toInt(),
    body('reorder_level').isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer').toInt(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, generic, category, unit, unit_price, stock, reorder_level, status = 'active' } = req.body;
      const { hospitalId } = req;

      /* Check for duplicate name within this hospital */
      const existing = await db('formulary')
        .whereILike('name', name)
        .where('hospital_id', hospitalId)
        .first();
      if (existing) return res.status(409).json({ error: 'A drug with this name already exists in your formulary' });

      const [drug] = await db('formulary').insert({
        hospital_id:   hospitalId,
        name,
        generic:       generic ?? null,
        category,
        unit,
        unit_price,
        stock,
        reorder_level,
        status,
        created_by:    req.user.id,
      }).returning('*');

      res.status(201).json({ drug });
    } catch (err) { next(err); }
  },
);

/* ════════════════════════════════════════════════
   PUT /api/v1/formulary/:id  — update drug
════════════════════════════════════════════════ */
router.put('/:id',
  allow('admin', 'pharmacist'),
  [
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('generic').optional().trim().isLength({ max: 200 }),
    body('category').optional().trim().notEmpty().isLength({ max: 100 }),
    body('unit').optional().trim().notEmpty().isLength({ max: 50 }),
    body('unit_price').optional().isFloat({ min: 0 }).toFloat(),
    body('stock').optional().isInt({ min: 0 }).toInt(),
    body('reorder_level').optional().isInt({ min: 0 }).toInt(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const drug = await db('formulary')
        .where({ id: req.params.id, hospital_id: req.hospitalId })
        .first();
      if (!drug) return res.status(404).json({ error: 'Drug not found' });

      const allowed = ['name','generic','category','unit','unit_price','stock','reorder_level','status'];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      updates.updated_at = new Date();

      const [updated] = await db('formulary')
        .where({ id: req.params.id, hospital_id: req.hospitalId })
        .update(updates)
        .returning('*');

      res.json({ drug: updated });
    } catch (err) { next(err); }
  },
);

/* ════════════════════════════════════════════════
   DELETE /api/v1/formulary/:id  — deactivate (soft delete)
════════════════════════════════════════════════ */
router.delete('/:id',
  allow('admin'),
  async (req, res, next) => {
    try {
      const drug = await db('formulary')
        .where({ id: req.params.id, hospital_id: req.hospitalId })
        .first();
      if (!drug) return res.status(404).json({ error: 'Drug not found' });

      await db('formulary')
        .where({ id: req.params.id })
        .update({ status: 'inactive', updated_at: new Date() });

      res.json({ message: 'Drug deactivated successfully' });
    } catch (err) { next(err); }
  },
);

export default router;
