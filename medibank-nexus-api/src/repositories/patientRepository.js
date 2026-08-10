import db from '../db.js';

export class PatientRepository {
  static async getAll(hospitalId) {
    return db('patients').where({ hospital_id: hospitalId });
  }

  static async findById(id, hospitalId) {
    return db('patients')
      .where({ id, hospital_id: hospitalId })
      .first();
  }

  static async findByNameOrId(hospitalId, q, limit, offset) {
    let query = db('patients')
      .where({ hospital_id: hospitalId })
      .select(
        'id','first_name','last_name','dob','gender','phone','email',
        'blood_group','genotype','allergies','conditions','created_at',
      );

    if (q) {
      const term = `%${q.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw("lower(first_name || ' ' || last_name) like ?", [term])
            .orWhereRaw('lower(id) like ?', [term]);
      });
    }

    const [{ count }] = await query.clone().count('id as count');
    const rows = await query.orderBy('created_at','desc').limit(limit).offset(offset);
    return { rows, count: parseInt(count) };
  }

  static async findLastPatient(hospitalId, prefix) {
    return db('patients')
      .where({ hospital_id: hospitalId })
      .whereLike('id', `${prefix}%`)
      .orderBy('id', 'desc')
      .first();
  }

  static async create(patientData) {
    const [patient] = await db('patients').insert(patientData).returning('*');
    return patient;
  }

  static async update(id, hospitalId, patchData) {
    const [updated] = await db('patients')
      .where({ id, hospital_id: hospitalId })
      .update({ ...patchData, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  static async getVisits(patientId, limit = 5) {
    return db('visits')
      .where({ patient_id: patientId })
      .orderBy('date', 'desc')
      .limit(limit)
      .select('id','date','chief','diagnosis','doctor_id');
  }
}
