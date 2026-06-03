/**
 * Database Seeder — creates demo hospital + staff accounts for testing
 * Usage: npm run db:seed
 *
 * Creates:
 *  - 1 demo hospital: "Lagos General Hospital"
 *  - 5 staff: admin, doctor, nurse, pharmacist, patient
 *  - All passwords: Welcome@123
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg     from 'pg';
import { randomUUID } from 'crypto';

const pool = new pg.Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME     ?? 'medibank',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
});

const TEMP_PASSWORD = 'Welcome@123';

const HOSPITAL = {
  id:            randomUUID(),
  name:          'Lagos General Hospital',
  short_name:    'LGH',
  type:          'Government Hospital',
  tier:          'professional',
  address:       '1 Hospital Road, Ikeja',
  city:          'Lagos',
  state:         'Lagos',
  phone:         '+234 1 234 5678',
  email:         'admin@lgh.gov.ng',
  license_number:'MDCN-2024-LGH-001',
  primary_color: '#0a6ebd',
  status:        'active',
};

const STAFF = [
  { email: 'admin@lgh.gov.ng',      name: 'Dr. Chukwuemeka Obi',    role: 'admin',      dept: 'Administration' },
  { email: 'doctor@lgh.gov.ng',     name: 'Dr. Adaeze Nwosu',        role: 'doctor',     dept: 'General Medicine' },
  { email: 'nurse@lgh.gov.ng',      name: 'Nurse Fatima Hassan',     role: 'nurse',      dept: 'Ward A' },
  { email: 'pharmacist@lgh.gov.ng', name: 'Pharm. Babatunde Lawal',  role: 'pharmacist', dept: 'Pharmacy' },
  { email: 'patient@lgh.gov.ng',    name: 'Chidi Obi',               role: 'patient',    dept: '' },
];

async function seed() {
  const client = await pool.connect();
  try {
    /* Check if already seeded */
    const exists = await client.query("SELECT id FROM hospitals WHERE email = $1", [HOSPITAL.email]);
    if (exists.rows.length > 0) {
      console.log('\n⚠️  Seed data already exists. Skipping.\n');
      console.log('   To re-seed, run: npm run db:migrate -- --reset && npm run db:seed\n');
      return;
    }

    /* Insert hospital */
    await client.query(`
      INSERT INTO hospitals (id,name,short_name,type,tier,address,city,state,phone,email,license_number,primary_color,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [
      HOSPITAL.id, HOSPITAL.name, HOSPITAL.short_name, HOSPITAL.type,
      HOSPITAL.tier, HOSPITAL.address, HOSPITAL.city, HOSPITAL.state,
      HOSPITAL.phone, HOSPITAL.email, HOSPITAL.license_number,
      HOSPITAL.primary_color, HOSPITAL.status,
    ]);
    console.log(`\n✅ Hospital created: ${HOSPITAL.name} (${HOSPITAL.id})`);

    /* Insert staff */
    const hashed = await bcrypt.hash(TEMP_PASSWORD, 12);
    for (const s of STAFF) {
      const uid = randomUUID();
      await client.query(`
        INSERT INTO users (id, hospital_id, email, password, name, role, dept, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      `, [uid, HOSPITAL.id, s.email, hashed, s.name, s.role, s.dept]);
      console.log(`   👤 ${s.role.padEnd(12)} ${s.name} <${s.email}>`);
    }

    console.log(`\n🔑 All passwords: ${TEMP_PASSWORD}`);
    console.log('\n🏥 MediBank Nexus demo data ready!\n');

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err.message); process.exit(1); });
