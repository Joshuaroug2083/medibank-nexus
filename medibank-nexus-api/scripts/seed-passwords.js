/**
 * Seed demo users with properly bcrypt-hashed passwords.
 * Run AFTER the SQL schema has been applied:
 *   node scripts/seed-passwords.js
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import db from '../src/db.js';

const HOSPITAL_ID = 'a0000000-0000-0000-0000-000000000001';

const USERS = [
  { name: 'Adaeze Okonkwo',  email: 'nurse@medibank.ng',   password: 'nurse123',   role: 'nurse',       dept: 'Front Desk & Admissions' },
  { name: 'Dr. Emeka Nwosu', email: 'doctor@medibank.ng',  password: 'doctor123',  role: 'doctor',      dept: 'General Medicine'        },
  { name: 'Bisi Adeleke',    email: 'pharma@medibank.ng',  password: 'pharma123',  role: 'pharmacist',  dept: 'Pharmacy'                },
  { name: 'Joshua Bankole',  email: 'admin@medibank.ng',   password: 'admin123',   role: 'admin',       dept: 'Administration'          },
  { name: 'Chidi Obi',       email: 'patient@medibank.ng', password: 'patient123', role: 'patient',     dept: 'Patient Portal'          },
];

const MEDICATIONS = [
  { name: 'Paracetamol 500mg', unit: 'tablets', quantity: 500, reorder_at: 100 },
  { name: 'Amoxicillin 250mg', unit: 'capsules', quantity: 200, reorder_at: 50  },
  { name: 'Ibuprofen 400mg',   unit: 'tablets', quantity: 350, reorder_at: 80  },
  { name: 'Metformin 500mg',   unit: 'tablets', quantity: 180, reorder_at: 50  },
  { name: 'Amlodipine 5mg',    unit: 'tablets', quantity: 25,  reorder_at: 30  },
  { name: 'Lisinopril 10mg',   unit: 'tablets', quantity: 15,  reorder_at: 30  },
  { name: 'Omeprazole 20mg',   unit: 'capsules', quantity: 420, reorder_at: 80  },
  { name: 'Azithromycin 250mg',unit: 'tablets', quantity: 90,  reorder_at: 40  },
];

async function seed() {
  console.log('Seeding demo users…');
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await db('users')
      .insert({ hospital_id: HOSPITAL_ID, email: u.email, password: hashed, name: u.name, role: u.role, dept: u.dept })
      .onConflict(['hospital_id', 'email']).merge(['password', 'name', 'role', 'dept']);
    console.log(`  ✓ ${u.role.padEnd(12)} ${u.email}`);
  }

  console.log('\nSeeding demo medications…');
  for (const m of MEDICATIONS) {
    await db('medications')
      .insert({ hospital_id: HOSPITAL_ID, ...m })
      .onConflict(['hospital_id', 'name']).merge(['quantity', 'reorder_at']);
    console.log(`  ✓ ${m.name}`);
  }

  console.log('\nDone! You can now log in with the demo accounts.');
  await db.destroy();
}

seed().catch(e => { console.error(e); process.exit(1); });
