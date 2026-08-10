import { PatientRepository } from '../repositories/patientRepository.js';
import { encryptPatient, decryptPatient, decryptPatients, decrypt } from '../security/encryption.js';
import { filterPatient, filterPatients } from '../security/dataFilter.js';
import { audit } from '../middleware/audit.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler.js';

export class PatientService {
  static async getPatientIdForUser(userId, userEmail, hospitalId) {
    const patients = await PatientRepository.getAll(hospitalId);
    for (const p of patients) {
      if (p.email && decrypt(p.email) === userEmail) {
        return p.id;
      }
    }
    return null;
  }

  static async nextPatientId(hospitalId) {
    const year  = new Date().getFullYear();
    const prefix = `PT-${year}-`;
    const last   = await PatientRepository.findLastPatient(hospitalId, prefix);
    const seq = last ? parseInt(last.id.split('-')[2]) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  static async listPatients(hospitalId, { q, page = 1, limit = 20 }, userRole, userEmail) {
    const offset = (page - 1) * limit;

    if (q && q.includes('@')) {
      const allPatients = await PatientRepository.getAll(hospitalId);
      const decrypted = decryptPatients(allPatients);
      const matched = decrypted.filter(p => p.email && p.email.toLowerCase() === q.toLowerCase());
      const count = matched.length;
      const sliced = matched.slice(offset, offset + limit);
      const filtered = filterPatients(sliced, userRole, userEmail);
      return { patients: filtered, total: count, page: +page, limit: +limit };
    }

    const { rows, count } = await PatientRepository.findByNameOrId(hospitalId, q, limit, offset);
    const decrypted = decryptPatients(rows);
    const filtered = filterPatients(decrypted, userRole, userEmail);
    return { patients: filtered, total: count, page: +page, limit: +limit };
  }

  static async registerPatient(hospitalId, user, body) {
    const {
      firstName, lastName, dob, gender, phone, email, nin,
      address, state, bloodGroup, genotype, allergies, conditions, medications,
      insurance, insNumber, ecName, ecPhone, ecRelation,
    } = body;

    if (!firstName || !lastName || !dob) {
      throw new ValidationError('firstName, lastName and dob are required');
    }

    const id = await this.nextPatientId(hospitalId);

    const rawData = {
      id,
      hospital_id:    hospitalId,
      first_name:     firstName,
      last_name:      lastName,
      dob,
      gender,
      phone,
      email,
      nin,
      address,
      state,
      blood_group:    bloodGroup,
      genotype,
      allergies:      allergies  ?? [],
      conditions:     conditions ?? [],
      medications:    medications ?? [],
      insurance,
      ins_number:     insNumber,
      ec_name:        ecName,
      ec_phone:       ecPhone,
      ec_relation:    ecRelation,
      registered_by:  user.id,
    };

    const encrypted = encryptPatient(rawData);
    const patientRow = await PatientRepository.create(encrypted);

    audit({
      userId: user.id, hospitalId,
      action: 'register_patient', entity: 'patient', entityId: id,
    });

    const decrypted = decryptPatient(patientRow);
    const filtered  = filterPatient(decrypted, user.role, user.email);
    return filtered;
  }

  static async getPatientById(id, hospitalId, userRole, userEmail) {
    const row = await PatientRepository.findById(id, hospitalId);
    if (!row) {
      throw new NotFoundError('Patient not found');
    }

    const patient = filterPatient(decryptPatient(row), userRole, userEmail);
    if (!patient) {
      throw new ForbiddenError('Access denied');
    }

    const visits = await PatientRepository.getVisits(id);
    return { patient, visits };
  }

  static async updatePatient(id, hospitalId, user, body) {
    const existing = await PatientRepository.findById(id, hospitalId);
    if (!existing) {
      throw new NotFoundError('Patient not found');
    }

    const allowed = [
      'first_name','last_name','dob','gender','phone','email','address','state',
      'blood_group','genotype','allergies','conditions','medications',
      'insurance','ins_number','ec_name','ec_phone','ec_relation',
    ];
    const keyMap = {
      firstName: 'first_name', lastName: 'last_name', bloodGroup: 'blood_group',
      insNumber: 'ins_number', ecName: 'ec_name', ecPhone: 'ec_phone', ecRelation: 'ec_relation',
    };
    const patch = {};
    for (const [k, v] of Object.entries(body)) {
      const col = keyMap[k] ?? k;
      if (allowed.includes(col)) patch[col] = v;
    }

    const encryptedPatch = encryptPatient(patch);
    const updated = await PatientRepository.update(id, hospitalId, encryptedPatch);

    audit({ userId: user.id, hospitalId, action: 'update_patient', entity: 'patient', entityId: id });

    const filtered = filterPatient(decryptPatient(updated), user.role, user.email);
    return filtered;
  }
}
