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

async function runPortalTests() {
  console.log('🚀 Starting Patient Portal & Deep Route Security Tests...\n');

  // 1. Login as Patient
  console.log('👉 Logging in as Patient (patient@lgh.gov.ng)...');
  const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@lgh.gov.ng', password: 'Welcome@123' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Patient login failed: ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const patientToken = loginData.accessToken;
  console.log('✅ Patient login successful.');

  // 2. Register a patient matching patient@lgh.gov.ng so they have a database profile linked to user email
  // Let's login as Admin to create this patient first
  console.log('👉 Logging in as Admin to create patient record linked to patient@lgh.gov.ng...');
  const adminLoginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lgh.gov.ng', password: 'Welcome@123' }),
  });
  const adminToken = (await adminLoginRes.json()).accessToken;

  const ownPatientData = {
    firstName: 'Chidi',
    lastName: 'Obi',
    dob: '1992-03-14',
    gender: 'male',
    phone: '+234 801 234 5678',
    email: 'patient@lgh.gov.ng', // links to the patient user
    nin: '12345678901',
    address: '14 Akin Adesola Street, Victoria Island',
    state: 'Lagos',
    bloodGroup: 'O+',
    genotype: 'AS',
    allergies: ['Penicillin', 'Aspirin'],
    conditions: ['Hypertension'],
    medications: ['Lisinopril 10mg daily'],
    insurance: 'NHIS',
    insNumber: 'NHIS-2026-00342',
    ecName: 'Ngozi Obi', // Should be encrypted under Phase 4
    ecPhone: '+234 802 345 6789',
    ecRelation: 'Spouse',
  };

  console.log('👉 Creating patient record for patient@lgh.gov.ng...');
  const regRes = await fetch(`${API_BASE}/api/v1/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(ownPatientData),
  });
  if (!regRes.ok) {
    throw new Error(`Patient creation failed: ${regRes.status} ${await regRes.text()}`);
  }
  const ownPatient = (await regRes.json()).patient;
  const ownPatientId = ownPatient.id;
  console.log(`✅ Patient record created. ID: ${ownPatientId}`);

  // Create another patient record for another user (different email)
  const otherPatientData = {
    firstName: 'Other',
    lastName: 'Patient',
    dob: '1995-10-10',
    gender: 'female',
    phone: '+234 809 111 2222',
    email: 'other.patient@example.com',
    nin: '98765432101',
  };
  console.log('👉 Creating other patient record (other.patient@example.com)...');
  const regOtherRes = await fetch(`${API_BASE}/api/v1/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(otherPatientData),
  });
  const otherPatientId = (await regOtherRes.json()).patient.id;
  console.log(`✅ Other patient record created. ID: ${otherPatientId}`);

  // 3. Inspect DB directly to verify ec_name is encrypted
  console.log('👉 Inspecting DB directly to check ec_name encryption...');
  const dbRes = await pool.query('SELECT ec_name, ec_phone FROM patients WHERE id = $1', [ownPatientId]);
  const dbRow = dbRes.rows[0];
  console.log(` - DB ec_name:  ${dbRow.ec_name}`);
  console.log(` - DB ec_phone: ${dbRow.ec_phone}`);

  if (dbRow.ec_name.startsWith('enc:v1:') && dbRow.ec_phone.startsWith('enc:v1:')) {
    console.log('✅ PASS: Both ec_name and ec_phone are stored encrypted at rest.');
  } else {
    throw new Error('FAIL: ec_name was NOT stored encrypted!');
  }

  // 4. Test resolved patient lookup by email search
  console.log('👉 Patient searching for their own profile via email query...');
  const searchRes = await fetch(`${API_BASE}/api/v1/patients?q=patient@lgh.gov.ng&limit=1`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  const searchData = await searchRes.json();
  const foundPatient = searchData.patients?.[0];
  if (foundPatient && foundPatient.id === ownPatientId) {
    console.log(`✅ PASS: Patient successfully resolved their profile. Name: ${foundPatient.first_name} ${foundPatient.last_name}`);
  } else {
    throw new Error(`FAIL: Patient could not resolve profile: ${JSON.stringify(searchData)}`);
  }

  // 5. Test patient retrieval of own record vs other patient record
  console.log('👉 Patient retrieving their own patient record...');
  const getOwnRes = await fetch(`${API_BASE}/api/v1/patients/${ownPatientId}`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  if (getOwnRes.ok) {
    const ownPatientObj = (await getOwnRes.json()).patient;
    console.log(`✅ PASS: Patient got their own profile. Decrypted ec_name: ${ownPatientObj.ec_name}`);
  } else {
    throw new Error(`FAIL: Patient own profile retrieval failed: ${getOwnRes.status}`);
  }

  console.log('👉 Patient attempting to retrieve other patient record...');
  const getOtherRes = await fetch(`${API_BASE}/api/v1/patients/${otherPatientId}`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(` - Response status: ${getOtherRes.status}`);
  if (getOtherRes.status === 403) {
    console.log('✅ PASS: Retrieve other patient record rejected with 403.');
  } else {
    throw new Error('FAIL: Patient was allowed to view another patient\'s record!');
  }

  // 6. Test patient billing/invoices ownership
  console.log('👉 Patient attempting to access invoices for another patient...');
  const billingOtherRes = await fetch(`${API_BASE}/api/v1/billing/patient/${otherPatientId}`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(` - Response status: ${billingOtherRes.status}`);
  if (billingOtherRes.status === 403) {
    console.log('✅ PASS: View other patient invoices list rejected with 403.');
  } else {
    throw new Error('FAIL: Patient was allowed to view other patient\'s invoice list!');
  }

  console.log('👉 Patient viewing own invoices list (should be empty but succeed with 200)...');
  const billingOwnRes = await fetch(`${API_BASE}/api/v1/billing/patient/${ownPatientId}`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(` - Response status: ${billingOwnRes.status}`);
  if (billingOwnRes.ok) {
    console.log('✅ PASS: View own invoice list succeeded.');
  } else {
    throw new Error('FAIL: Patient was blocked from viewing own invoices!');
  }

  // 7. Check GET /wards is restricted
  console.log('👉 Patient attempting to call GET /api/v1/inpatient/wards...');
  const wardsRes = await fetch(`${API_BASE}/api/v1/inpatient/wards`, {
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  console.log(` - Response status: ${wardsRes.status}`);
  if (wardsRes.status === 403) {
    console.log('✅ PASS: Access to wards endpoint restricted for patients.');
  } else {
    throw new Error('FAIL: Patient was allowed to fetch ward lists!');
  }

  console.log('\n🎉 ALL PATIENT PORTAL & SECURITY COMPLIANCE TESTS PASSED SUCCESSFULLY! 🎉\n');
  await pool.end();
}

runPortalTests().catch(async (err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  await pool.end();
  process.exit(1);
});
