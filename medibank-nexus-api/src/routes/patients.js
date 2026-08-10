import { Router }  from 'express';
import authenticate from '../middleware/auth.js';
import { allow }    from '../middleware/rbac.js';
import { PatientService } from '../services/patientService.js';

export async function getPatientIdForUser(userId, userEmail, hospitalId) {
  return PatientService.getPatientIdForUser(userId, userEmail, hospitalId);
}

const router = Router();
router.use(authenticate);

/* ── GET /api/v1/patients ───────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const result = await PatientService.listPatients(
      req.hospitalId,
      { q, page: parseInt(page), limit: parseInt(limit) },
      req.user.role,
      req.user.email
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/patients ──────────────────────────────────── */
router.post('/', allow('nurse', 'admin'), async (req, res, next) => {
  try {
    const patient = await PatientService.registerPatient(req.hospitalId, req.user, req.body);
    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/patients/:id ───────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await PatientService.getPatientById(
      req.params.id,
      req.hospitalId,
      req.user.role,
      req.user.email
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/patients/:id ───────────────────────────────── */
router.put('/:id', allow('nurse', 'doctor', 'admin'), async (req, res, next) => {
  try {
    const patient = await PatientService.updatePatient(
      req.params.id,
      req.hospitalId,
      req.user,
      req.body
    );
    return res.json({ patient });
  } catch (err) {
    next(err);
  }
});

export default router;
