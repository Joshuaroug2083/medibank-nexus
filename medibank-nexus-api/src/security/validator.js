/**
 * Input Validation Schemas — express-validator
 *
 * Every route that accepts user input must run these validators.
 * They protect against:
 *   - Empty / missing required fields
 *   - Type mismatches (string where number expected, etc.)
 *   - Oversized payloads (DoS via large strings)
 *   - Invalid formats (emails, phone numbers, dates)
 *   - SQL/NoSQL/script injection through strict whitelist patterns
 */
import { body, param, query, validationResult } from 'express-validator';

/* ── Shared reusable rules ────────────────────────────────────── */
const NG_PHONE = /^(\+?234|0)[789]\d{9}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;

/* Reject any value containing common injection patterns */
function noInjection(value) {
  if (typeof value !== 'string') return true;
  const patterns = [
    /<script/i, /javascript:/i, /on\w+\s*=/i,    // XSS
    /(\bDROP\b|\bTRUNCATE\b|\bDELETE\b.*\bFROM\b|\bINSERT\b.*\bINTO\b)/i,  // SQL
    /\$where|\$gt|\$lt|\$ne|\$regex/i,            // NoSQL
    /\.\.\//,                                      // Path traversal
  ];
  return !patterns.some(p => p.test(value));
}

/* String field: required, trimmed, max length, no injection */
const safeStr = (field, max = 255) =>
  body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ max }).withMessage(`${field} must be ${max} characters or less`)
    .custom(noInjection).withMessage(`${field} contains invalid characters`);

const optStr = (field, max = 255) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max }).withMessage(`${field} must be ${max} characters or less`)
    .custom(noInjection).withMessage(`${field} contains invalid characters`);

/* ════════════════════════════════════════════════════════════════
   VALIDATION SETS
════════════════════════════════════════════════════════════════ */

/** Middleware: run validators and return 400 if any fail */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error:  'Validation failed',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/* ── Auth ────────────────────────────────────────────────────── */
export const loginRules = [
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address')
    .isLength({ max: 320 }),
  body('password')
    .isLength({ min: 1, max: 128 }).withMessage('Password is required'),
];

export const changePasswordRules = [
  body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

/* ── Hospital onboarding ────────────────────────────────────── */
export const hospitalRules = [
  safeStr('name',        100),
  safeStr('shortName',   8),
  safeStr('type',        80),
  safeStr('licenseNumber', 50),
  safeStr('address',     255),
  safeStr('city',        80),
  body('state').trim().notEmpty().withMessage('state is required'),

  body('phone')
    .trim()
    .matches(NG_PHONE).withMessage('Enter a valid Nigerian phone number (e.g. +234 801 234 5678)'),

  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address')
    .isLength({ max: 320 }),

  /* Admin account */
  safeStr('adminName',   100),
  body('adminEmail')
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid admin email address')
    .isLength({ max: 320 }),
  body('adminPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Admin password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('adminPhone')
    .trim()
    .matches(NG_PHONE).withMessage('Enter a valid Nigerian phone number for admin'),
];

/* ── Staff ────────────────────────────────────────────────────── */
export const addStaffRules = [
  safeStr('name', 100),
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address'),
  body('role')
    .isIn(['nurse','doctor','pharmacist','admin']).withMessage('Invalid role'),
  safeStr('dept', 100),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(NG_PHONE).withMessage('Enter a valid Nigerian phone number'),
];

/* ── Patient registration ────────────────────────────────────── */
export const patientRules = [
  safeStr('firstName',    80),
  safeStr('lastName',     80),
  body('dob')
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom(v => {
      const dob  = new Date(v);
      const now  = new Date();
      const age  = (now - dob) / (365.25 * 24 * 3600 * 1000);
      if (age < 0 || age > 130) throw new Error('Date of birth is not realistic');
      return true;
    }),
  body('gender')
    .optional({ nullable: true })
    .isIn(['Male','Female','Other','Prefer not to say']).withMessage('Invalid gender value'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(NG_PHONE).withMessage('Enter a valid Nigerian phone number'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim().toLowerCase()
    .isEmail().withMessage('Enter a valid email address'),
  body('nin')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 11, max: 11 }).withMessage('NIN must be exactly 11 digits')
    .isNumeric().withMessage('NIN must contain only digits'),
  optStr('address',    255),
  optStr('bloodGroup', 10),
  optStr('genotype',   10),
  body('allergies')
    .optional().isArray({ max: 30 }).withMessage('allergies must be an array of up to 30 items'),
  body('allergies.*')
    .optional().trim().isLength({ max: 100 }).custom(noInjection),
  body('conditions')
    .optional().isArray({ max: 50 }),
  body('conditions.*')
    .optional().trim().isLength({ max: 150 }).custom(noInjection),
  body('ecPhone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(NG_PHONE).withMessage('Enter a valid emergency contact phone number'),
];

/* ── Visit / Consultation ────────────────────────────────────── */
export const visitRules = [
  body('patientId').trim().notEmpty().withMessage('patientId is required'),
  optStr('chief',     500),
  optStr('hpi',       2000),
  optStr('diagnosis', 500),
  optStr('plan',      2000),
  body('bp')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Blood pressure must be in format 120/80'),
  body('pulse')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 20, max: 300 }).withMessage('Pulse must be between 20 and 300 bpm'),
  body('temp')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 30, max: 45 }).withMessage('Temperature must be between 30–45°C'),
  body('spo2')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 50, max: 100 }).withMessage('SpO2 must be between 50–100%'),
  body('rr')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 4, max: 80 }).withMessage('Respiratory rate must be between 4–80'),
  body('weight')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0.5, max: 500 }).withMessage('Weight must be between 0.5–500 kg'),
];

/* ── Prescription items ──────────────────────────────────────── */
export const prescriptionRules = [
  body('items').isArray({ min: 1, max: 20 }).withMessage('items must be an array of 1–20 entries'),
  body('items.*.drug').trim().notEmpty().isLength({ max: 150 }).custom(noInjection),
  body('items.*.dose')
    .optional().trim().isLength({ max: 50 }).custom(noInjection),
  body('items.*.frequency')
    .optional().trim().isLength({ max: 100 }).custom(noInjection),
  body('items.*.duration')
    .optional().trim().isLength({ max: 50 }).custom(noInjection),
  body('items.*.route')
    .optional()
    .isIn(['Oral','IV','IM','SC','Topical','Inhaled','Sublingual','Rectal','Nasal','Optic','Otic'])
    .withMessage('Invalid route of administration'),
];

/* ── Appointment ─────────────────────────────────────────────── */
export const appointmentRules = [
  body('patientId').trim().notEmpty().withMessage('patientId is required'),
  body('doctorId').trim().notEmpty().withMessage('doctorId is required'),
  body('date').isISO8601().withMessage('date must be YYYY-MM-DD')
    .custom(v => {
      if (new Date(v) < new Date(new Date().toDateString())) throw new Error('Appointment date cannot be in the past');
      return true;
    }),
  body('time')
    .matches(/^\d{2}:\d{2}$/).withMessage('time must be HH:MM')
    .custom(v => {
      const [h, m] = v.split(':').map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error('Invalid time');
      return true;
    }),
  optStr('type',  80),
  optStr('notes', 500),
  body('reminder')
    .optional()
    .isIn(['sms','email','none']).withMessage('reminder must be sms, email, or none'),
];

/* ── UUID param guard ────────────────────────────────────────── */
export const uuidParam = (paramName) =>
  param(paramName)
    .trim()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    .withMessage(`${paramName} must be a valid UUID`);

/* ── Pagination guard ────────────────────────────────────────── */
export const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
