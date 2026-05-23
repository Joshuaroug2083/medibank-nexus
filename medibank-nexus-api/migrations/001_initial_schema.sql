-- ══════════════════════════════════════════════════════════════════════
-- MediBank Nexus — Initial Database Schema (Multi-Tenant)
-- Run once: psql -U postgres -d medibank -f migrations/001_initial_schema.sql
-- ══════════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────
-- 1. HOSPITALS  (tenant root — every other table references this)
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  short_name     TEXT        NOT NULL,
  type           TEXT,                      -- 'Government Hospital', 'Private Clinic', …
  tier           TEXT        NOT NULL DEFAULT 'starter'
                             CHECK (tier IN ('starter','professional','enterprise')),
  address        TEXT,
  city           TEXT,
  state          TEXT,
  phone          TEXT,
  email          TEXT,
  license_number TEXT,
  primary_color  TEXT        DEFAULT '#0a6ebd',
  status         TEXT        NOT NULL DEFAULT 'trial'
                             CHECK (status IN ('active','trial','suspended')),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- 2. USERS  (staff accounts — scoped to a hospital)
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id  UUID  NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  email        TEXT  NOT NULL,
  password     TEXT  NOT NULL,
  name         TEXT  NOT NULL,
  initials     TEXT  GENERATED ALWAYS AS (
                 upper(left(split_part(name, ' ', 1), 1) ||
                       left(split_part(name, ' ', 2), 1))
               ) STORED,
  role         TEXT  NOT NULL
               CHECK (role IN ('nurse','doctor','pharmacist','admin','patient')),
  dept         TEXT,
  status       TEXT  NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','suspended')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hospital_id, email)             -- email unique per hospital
);

-- ──────────────────────────────────────────────────────────────────────
-- 3. PATIENTS
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              TEXT        PRIMARY KEY,   -- PT-2026-XXXX
  hospital_id     UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  dob             DATE        NOT NULL,
  gender          TEXT,
  phone           TEXT,
  email           TEXT,
  nin             TEXT,                      -- National ID Number
  address         TEXT,
  state           TEXT,
  blood_group     TEXT,
  genotype        TEXT,
  allergies       TEXT[]      DEFAULT '{}',
  conditions      TEXT[]      DEFAULT '{}',
  medications     TEXT[]      DEFAULT '{}',
  insurance       TEXT,
  ins_number      TEXT,
  ec_name         TEXT,                      -- Emergency contact name
  ec_phone        TEXT,
  ec_relation     TEXT,
  registered_by   UUID        REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- 4. VISITS / CONSULTATIONS
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id          TEXT        PRIMARY KEY,       -- VIS-2026-XXXX
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id  TEXT        NOT NULL REFERENCES patients(id),
  doctor_id   UUID        NOT NULL REFERENCES users(id),
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  chief       TEXT,                          -- Chief complaint
  hpi         TEXT,                          -- History of present illness
  diagnosis   TEXT,
  plan        TEXT,
  -- Vitals
  bp          TEXT,                          -- e.g. "120/80"
  pulse       INT,
  temp        NUMERIC(4,1),
  spo2        INT,
  rr          INT,
  weight      NUMERIC(5,1),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- 5. PRESCRIPTIONS
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id          TEXT        PRIMARY KEY,       -- RX-2026-XXXX
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  visit_id    TEXT        NOT NULL REFERENCES visits(id),
  patient_id  TEXT        NOT NULL REFERENCES patients(id),
  doctor_id   UUID        NOT NULL REFERENCES users(id),
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','dispensed','cancelled')),
  dispensed_by UUID       REFERENCES users(id),
  dispensed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  rx_id      TEXT  NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug       TEXT  NOT NULL,
  dose       TEXT,
  frequency  TEXT,
  duration   TEXT,
  route      TEXT  DEFAULT 'Oral',
  notes      TEXT
);

-- ──────────────────────────────────────────────────────────────────────
-- 6. MEDICATIONS / INVENTORY
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID  NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name        TEXT  NOT NULL,
  unit        TEXT,
  quantity    INT   DEFAULT 0,
  reorder_at  INT   DEFAULT 30,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hospital_id, name)
);

-- ──────────────────────────────────────────────────────────────────────
-- 7. APPOINTMENTS
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          TEXT        PRIMARY KEY,       -- APT-2026-XXXX
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id  TEXT        NOT NULL REFERENCES patients(id),
  doctor_id   UUID        NOT NULL REFERENCES users(id),
  type        TEXT,
  date        DATE        NOT NULL,
  time        TIME        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes       TEXT,
  reminder    TEXT        DEFAULT 'sms',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- 8. NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT,                          -- 'new_patient', 'rx_ready', …
  priority    TEXT        DEFAULT 'medium'
              CHECK (priority IN ('low','medium','high','urgent')),
  title       TEXT        NOT NULL,
  body        TEXT,
  read        BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- 9. AUDIT LOG
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID        REFERENCES hospitals(id),
  user_id     UUID        REFERENCES users(id),
  action      TEXT        NOT NULL,          -- 'login', 'register_patient', …
  entity      TEXT,                          -- 'patient', 'visit', …
  entity_id   TEXT,
  level       TEXT        DEFAULT 'info'
              CHECK (level IN ('info','warning','error')),
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════
-- INDEXES  (performance on common queries)
-- ══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_hospital        ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital     ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_visits_hospital       ON visits(hospital_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient        ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor         ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status  ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hosp    ON prescriptions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date     ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_hospital        ON audit_log(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medications_hospital  ON medications(hospital_id);

-- ══════════════════════════════════════════════════════════════════════
-- SEED DATA — Lagos General Hospital (matches frontend mock users)
-- Password for all demo accounts: hash of their mock password
-- ══════════════════════════════════════════════════════════════════════

-- Demo hospital
INSERT INTO hospitals (id, name, short_name, type, tier, address, city, state, phone, email, license_number, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Lagos General Hospital', 'LGH', 'Government Hospital', 'enterprise',
  '23 Broad Street, Lagos Island', 'Lagos', 'Lagos',
  '+234 801 234 5678', 'admin@lagosgeneralhospital.ng',
  'MDCN/2024/LGS/001', 'active'
) ON CONFLICT DO NOTHING;

-- Note: passwords below are bcrypt hashes.
-- nurse123  → $2b$10$N5PBv7f3YVZR7y1XkHU4q.4L1vMZhfFl1F3OT1kREJOFLMZBg0f4y
-- doctor123 → $2b$10$VjkXGp7XO0DQi0UfEXv3WeXi9AQAK3kF4BYkQ0FQSrIjwvN5M2Bm6
-- pharma123 → $2b$10$t1bpz3Y2Pg3nIJEsB0bWTuD5HfPTZvlpT7z5m4b9z7TrOk7kT0oWy
-- admin123  → $2b$10$dHf7vVLk0QNBJHKkm9I5BO9e0G8M3Nj6jV0B0kBhb3Dz0UtKK0Hae
-- patient123→ $2b$10$1SfGzCmfmFzMvW9Hxr4GweFC7bOh3L1sB2pLr0dxZb7aK5Gdt9rKi
--
-- IMPORTANT: Run this script first, then run:
--   node scripts/seed-passwords.js
-- to insert users with properly hashed passwords.

COMMENT ON TABLE hospitals    IS 'Multi-tenant root — one row per hospital/clinic';
COMMENT ON TABLE users        IS 'Staff accounts scoped to a hospital';
COMMENT ON TABLE patients     IS 'Patient records scoped to a hospital';
COMMENT ON TABLE visits       IS 'Doctor consultation records';
COMMENT ON TABLE prescriptions IS 'Prescriptions issued per visit';
COMMENT ON TABLE medications  IS 'Drug inventory per hospital';
COMMENT ON TABLE appointments IS 'Scheduled appointments';
COMMENT ON TABLE notifications IS 'In-app notifications per staff user';
COMMENT ON TABLE audit_log    IS 'Immutable action audit trail';
