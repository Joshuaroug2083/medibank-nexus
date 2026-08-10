import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3001';
const pool = new pg.Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME     ?? 'medibank',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
});

async function runTests() {
  console.log('🚀 Starting Security & PII Compliance Verification Tests...\n');

  // 1. Login as Admin
  console.log('👉 Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lgh.gov.ng', password: 'Welcome@123' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const adminToken = loginData.accessToken;
  const adminRefresh = loginData.refreshToken;
  console.log('✅ Admin login successful.');

  // 2. Login as Pharmacist
  console.log('👉 Logging in as Pharmacist...');
  const pharmaRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pharmacist@lgh.gov.ng', password: 'Welcome@123' }),
  });
  if (!pharmaRes.ok) {
    throw new Error(`Pharmacist login failed: ${pharmaRes.status}`);
  }
  const pharmaToken = (await pharmaRes.json()).accessToken;
  console.log('✅ Pharmacist login successful.');

  // 3. Register a new patient (as Admin)
  const testPatient = {
    firstName: 'Test-Ngozi',
    lastName: 'Adewale',
    dob: '1990-05-15',
    gender: 'female',
    phone: '+234 803 123 4567',
    email: 'ngozi.adewale@example.ng',
    nin: '12345678901',
    address: '15 Admiralty Way, Lekki',
    state: 'Lagos',
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: ['Penicillin'],
    conditions: ['Hypertension'],
    medications: [],
    insurance: 'HMO Africa',
    insNumber: 'POL-9988-77',
    ecName: 'Emeka Adewale',
    ecPhone: '+234 805 987 6543',
    ecRelation: 'Spouse',
  };

  console.log('👉 Registering a new patient with PII...');
  const regRes = await fetch(`${API_BASE}/api/v1/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(testPatient),
  });
  if (!regRes.ok) {
    throw new Error(`Patient registration failed: ${regRes.status} ${await regRes.text()}`);
  }
  const regData = await regRes.json();
  const patientId = regData.patient.id;
  console.log(`✅ Patient registered successfully. ID: ${patientId}`);

  // 4. Inspect DB directly to verify encryption
  console.log('👉 Querying database directly to check encryption...');
  const dbRes = await pool.query('SELECT phone, email, nin, ins_number, ec_phone FROM patients WHERE id = $1', [patientId]);
  const dbRow = dbRes.rows[0];
  console.log('Database raw row values:');
  console.log(` - phone:      ${dbRow.phone}`);
  console.log(` - email:      ${dbRow.email}`);
  console.log(` - nin:        ${dbRow.nin}`);
  console.log(` - ins_number: ${dbRow.ins_number}`);
  console.log(` - ec_phone:   ${dbRow.ec_phone}`);

  const isEncrypted = (val) => typeof val === 'string' && val.startsWith('enc:v1:');
  if (isEncrypted(dbRow.phone) && isEncrypted(dbRow.email) && isEncrypted(dbRow.nin)) {
    console.log('✅ PASS: PII fields are stored encrypted in the database.');
  } else {
    throw new Error('FAIL: PII fields are stored in plaintext!');
  }

  // 5. Retrieve patient as Admin (Full Decrypted Access)
  console.log('👉 Retrieving patient details as Admin...');
  const getAdminRes = await fetch(`${API_BASE}/api/v1/patients/${patientId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  const adminPatient = (await getAdminRes.json()).patient;
  console.log(` - Admin sees phone:      ${adminPatient.phone}`);
  console.log(` - Admin sees email:      ${adminPatient.email}`);
  console.log(` - Admin sees nin:        ${adminPatient.nin}`);
  if (adminPatient.phone === testPatient.phone && adminPatient.email === testPatient.email) {
    console.log('✅ PASS: Admin retrieved fully decrypted PII.');
  } else {
    throw new Error('FAIL: Decryption failed for Admin.');
  }

  // 6. Retrieve patient as Pharmacist (Masked / Restricted Access)
  console.log('👉 Retrieving patient details as Pharmacist...');
  const getPharmaRes = await fetch(`${API_BASE}/api/v1/patients/${patientId}`, {
    headers: { 'Authorization': `Bearer ${pharmaToken}` },
  });
  const pharmaPatient = (await getPharmaRes.json()).patient;
  console.log(` - Pharmacist sees phone:      ${pharmaPatient.phone}`);
  console.log(` - Pharmacist sees email:      ${pharmaPatient.email}`);
  console.log(` - Pharmacist sees nin:        ${pharmaPatient.nin}`);
  if (pharmaPatient.phone && pharmaPatient.phone.startsWith('*******')) {
    console.log('✅ PASS: Pharmacist sees masked phone.');
  } else {
    throw new Error('FAIL: Phone masking not working for Pharmacist.');
  }
  if (pharmaPatient.email === undefined && pharmaPatient.nin === undefined) {
    console.log('✅ PASS: Pharmacist is blocked from seeing email and NIN.');
  } else {
    throw new Error('FAIL: Pharmacist role-based masking bypass!');
  }

  // 7. Logout and revoke refresh token
  console.log('👉 Logging out Admin...');
  const logoutRes = await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ refreshToken: adminRefresh }),
  });
  if (!logoutRes.ok) {
    throw new Error(`Logout failed: ${logoutRes.status}`);
  }
  console.log('✅ Admin logged out successfully.');

  // 8. Try to refresh token using the revoked refresh token
  console.log('👉 Attempting to use the revoked refresh token...');
  const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: adminRefresh }),
  });
  console.log(` - Refresh response status: ${refreshRes.status}`);
  if (refreshRes.status === 401) {
    console.log('✅ PASS: Revoked refresh token was successfully rejected.');
  } else {
    throw new Error('FAIL: Revoked refresh token is still active!');
  }

  console.log('\n🎉 ALL SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  await pool.end();
}

runTests().catch(async (err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  await pool.end();
  process.exit(1);
});
