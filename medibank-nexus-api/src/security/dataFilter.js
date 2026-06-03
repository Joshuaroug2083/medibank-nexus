/**
 * Role-Based Data Filtering & Masking
 *
 * Different roles receive different levels of detail.
 * This prevents, for example, a pharmacist from seeing
 * a patient's home address or NIN.
 *
 * Principles:
 *   - "Minimum necessary" — each role sees only what they need
 *   - Sensitive fields are masked (last 4 chars shown) for non-admin
 *   - PII like NIN is only fully visible to admin and the patient's doctor
 *
 * Patient field access matrix:
 *   Field              nurse   doctor  pharmacist  admin   patient(own)
 *   ─────────────────────────────────────────────────────────────────
 *   name               ✓       ✓        ✓           ✓       ✓
 *   dob                ✓       ✓        ✓           ✓       ✓
 *   gender             ✓       ✓        ✓           ✓       ✓
 *   phone              ✓       ✓        masked       ✓       ✓
 *   email              ✓       ✓        ✗           ✓       ✓
 *   nin                masked  ✓        ✗           ✓       ✓
 *   address            ✓       ✓        ✗           ✓       ✓
 *   blood_group        ✓       ✓        ✓           ✓       ✓
 *   allergies          ✓       ✓        ✓           ✓       ✓
 *   conditions         ✓       ✓        ✓           ✓       ✓
 *   medications        ✓       ✓        ✓           ✓       ✓
 *   insurance          ✓       ✓        ✗           ✓       ✓
 *   ins_number         masked  ✓        ✗           ✓       ✓
 *   ec_name            ✓       ✓        ✗           ✓       ✓
 *   ec_phone           ✓       ✓        ✗           ✓       ✓
 *   ec_relation        ✓       ✓        ✗           ✓       ✓
 */
import { mask } from './encryption.js';

/* ── Mask helpers ────────────────────────────────────────────── */
const maskPhone  = (v) => v ? mask(v.replace(/\s/g,''), 4) : null;  // e.g. ********5678
const maskNin    = (v) => v ? '*'.repeat(7) + v.slice(-4)  : null;  // e.g. *******1234
const maskEmail  = (v) => {
  if (!v) return null;
  const [local, domain] = v.split('@');
  return `${local[0]}${'*'.repeat(Math.max(0, local.length - 2))}${local.slice(-1)}@${domain}`;
};

/* ── Patient field filters by role ──────────────────────────── */
const PATIENT_FILTERS = {

  nurse: (p) => ({
    id: p.id, first_name: p.first_name, last_name: p.last_name,
    dob: p.dob, gender: p.gender, phone: p.phone,
    email: p.email,
    nin: p.nin ? maskNin(p.nin) : null,
    address: p.address,
    blood_group: p.blood_group, genotype: p.genotype,
    allergies: p.allergies, conditions: p.conditions, medications: p.medications,
    insurance: p.insurance,
    ins_number: p.ins_number ? maskPhone(p.ins_number) : null,
    ec_name: p.ec_name, ec_phone: p.ec_phone, ec_relation: p.ec_relation,
    created_at: p.created_at,
  }),

  doctor: (p) => ({ ...p }),   // full access

  pharmacist: (p) => ({
    id: p.id, first_name: p.first_name, last_name: p.last_name,
    dob: p.dob, gender: p.gender,
    phone: p.phone ? maskPhone(p.phone) : null,
    blood_group: p.blood_group, genotype: p.genotype,
    allergies: p.allergies, conditions: p.conditions, medications: p.medications,
    /* No: email, nin, address, insurance, ins_number, emergency contact */
  }),

  admin: (p) => ({ ...p }),    // full access

  patient: (p, requesterId) => {
    /* Patient can only see their own record */
    if (p.id !== requesterId) return null;
    return { ...p };
  },
};

/**
 * Filter a patient object for the given role.
 * @param {object}      patient
 * @param {string}      role
 * @param {string|null} [patientUserId]  — used for 'patient' role to verify ownership
 */
export function filterPatient(patient, role, patientUserId = null) {
  const fn = PATIENT_FILTERS[role] ?? PATIENT_FILTERS.nurse;
  return fn(patient, patientUserId);
}

/**
 * Filter an array of patients.
 */
export function filterPatients(patients, role, patientUserId = null) {
  return patients
    .map(p => filterPatient(p, role, patientUserId))
    .filter(Boolean);   // removes nulls (e.g. patient viewing someone else's record)
}

/* ── Visit filters ───────────────────────────────────────────── */
/**
 * Pharmacists see only prescription-relevant visit fields.
 * Patients see their own visits but not the full clinical notes.
 */
export function filterVisit(visit, role) {
  if (role === 'pharmacist') {
    return {
      id:           visit.id,
      date:         visit.date,
      patient_id:   visit.patient_id,
      patient_name: visit.patient_name,
      doctor_name:  visit.doctor_name,
      /* No SOAP notes — pharmacist doesn't need clinical narrative */
    };
  }
  if (role === 'patient') {
    return {
      id:           visit.id,
      date:         visit.date,
      chief:        visit.chief,
      diagnosis:    visit.diagnosis,
      plan:         visit.plan,
      /* Vitals visible to patient */
      bp: visit.bp, pulse: visit.pulse, temp: visit.temp,
      spo2: visit.spo2, rr: visit.rr, weight: visit.weight,
      doctor_name:  visit.doctor_name,
      /* No HPI raw notes */
    };
  }
  return visit;   // nurse, doctor, admin see everything
}

/* ── User/staff filters ──────────────────────────────────────── */
/**
 * Strip password from any user object before sending in a response.
 * Always call this before res.json() with a user.
 */
export function safeUser(user) {
  if (!user) return null;
  const { password: _pw, ...rest } = user;
  return rest;
}

/**
 * For staff listing, non-admin roles see limited staff info.
 */
export function filterStaff(member, requestorRole) {
  const base = {
    id:       member.id,
    name:     member.name,
    initials: member.initials,
    role:     member.role,
    dept:     member.dept,
    status:   member.status,
  };
  if (requestorRole === 'admin') {
    return { ...base, email: member.email, created_at: member.created_at };
  }
  return base;    // other roles don't see email addresses of colleagues
}

/* ── Express middleware factory ──────────────────────────────── */
/**
 * Attach filterPatient / filterPatients to res.locals for use in routes.
 * Usage: router.get('/', dataFilter, async (req, res) => {
 *   const filtered = res.locals.filterPatient(patient);
 * })
 */
export function dataFilterMiddleware(req, res, next) {
  const role = req.user?.role ?? 'nurse';
  res.locals.filterPatient  = (p) => filterPatient(p, role);
  res.locals.filterPatients = (ps) => filterPatients(ps, role);
  res.locals.filterVisit    = (v) => filterVisit(v, role);
  res.locals.filterStaff    = (m) => filterStaff(m, role);
  next();
}
