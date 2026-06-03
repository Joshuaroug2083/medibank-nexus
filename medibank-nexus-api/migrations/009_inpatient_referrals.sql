-- ────────────────────────────────────────────────────────────────
-- Migration 009: Inpatient / Bed Management & Referral System
-- ────────────────────────────────────────────────────────────────

/* ── Wards ── */
CREATE TABLE IF NOT EXISTS wards (
  id          SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  ward_type   TEXT    NOT NULL DEFAULT 'general'
              CHECK (ward_type IN ('general','icu','maternity','paediatric','surgical','private','emergency')),
  total_beds  INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, name)
);
CREATE INDEX IF NOT EXISTS idx_wards_hospital ON wards(hospital_id);

/* ── Beds ── */
CREATE TABLE IF NOT EXISTS beds (
  id          SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  ward_id     INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  bed_number  TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'available'
              CHECK (status IN ('available','occupied','maintenance','reserved')),
  bed_type    TEXT    NOT NULL DEFAULT 'standard'
              CHECK (bed_type IN ('standard','icu','isolation','maternity')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ward_id, bed_number)
);
CREATE INDEX IF NOT EXISTS idx_beds_hospital ON beds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward     ON beds(ward_id);

/* ── Admissions ── */
CREATE TABLE IF NOT EXISTS admissions (
  id              SERIAL PRIMARY KEY,
  hospital_id     INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id      INTEGER NOT NULL REFERENCES patients(id),
  bed_id          INTEGER REFERENCES beds(id),
  ward_id         INTEGER REFERENCES wards(id),
  visit_id        INTEGER REFERENCES visits(id),
  admitted_by     INTEGER REFERENCES users(id),
  attending_doctor INTEGER REFERENCES users(id),
  admitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharged_at   TIMESTAMPTZ,
  discharge_notes TEXT,
  diagnosis       TEXT,
  status          TEXT NOT NULL DEFAULT 'admitted'
                  CHECK (status IN ('admitted','discharged','transferred')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admissions_hospital  ON admissions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_admissions_patient   ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status    ON admissions(status);

/* ── Nursing Notes ── */
CREATE TABLE IF NOT EXISTS nursing_notes (
  id           SERIAL PRIMARY KEY,
  hospital_id  INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  admission_id INTEGER REFERENCES admissions(id),
  visit_id     INTEGER REFERENCES visits(id),
  nurse_id     INTEGER NOT NULL REFERENCES users(id),
  note_type    TEXT NOT NULL DEFAULT 'general'
               CHECK (note_type IN ('general','vital_signs','intake_output','handover','incident','assessment')),
  content      TEXT NOT NULL,
  vitals       JSONB,   -- { bp, pulse, temp, spo2, rr, weight }
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_patient   ON nursing_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_admission ON nursing_notes(admission_id);

/* ── Medication Administration Record (MAR) ── */
CREATE TABLE IF NOT EXISTS mar_records (
  id             SERIAL PRIMARY KEY,
  hospital_id    INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id     INTEGER NOT NULL REFERENCES patients(id),
  admission_id   INTEGER REFERENCES admissions(id),
  drug_name      TEXT    NOT NULL,
  dose           TEXT    NOT NULL,
  route          TEXT    NOT NULL DEFAULT 'oral'
                 CHECK (route IN ('oral','iv','im','sc','topical','inhalation','pr','sl','other')),
  frequency      TEXT    NOT NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  administered_at TIMESTAMPTZ,
  administered_by INTEGER REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled','given','omitted','refused','held')),
  omission_reason TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mar_patient   ON mar_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_mar_admission ON mar_records(admission_id);

/* ── Referrals ── */
CREATE TABLE IF NOT EXISTS referrals (
  id               SERIAL PRIMARY KEY,
  hospital_id      INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  visit_id         INTEGER REFERENCES visits(id),
  referral_type    TEXT NOT NULL DEFAULT 'internal'
                   CHECK (referral_type IN ('internal','external')),
  from_dept        TEXT,
  from_doctor_id   INTEGER REFERENCES users(id),
  to_dept          TEXT,                       -- internal referral
  to_doctor_id     INTEGER REFERENCES users(id), -- internal
  to_hospital_name TEXT,                       -- external referral
  to_specialist    TEXT,                       -- external
  reason           TEXT NOT NULL,
  urgency          TEXT NOT NULL DEFAULT 'routine'
                   CHECK (urgency IN ('routine','urgent','emergency')),
  clinical_summary TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','completed','cancelled')),
  accepted_at      TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  response_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_hospital ON referrals(hospital_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient  ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status   ON referrals(status);

/* ── NDPR Data Subject Requests ── */
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id              SERIAL PRIMARY KEY,
  hospital_id     INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id      INTEGER REFERENCES patients(id),
  request_type    TEXT NOT NULL
                  CHECK (request_type IN ('access','erasure','portability','rectification','objection')),
  requester_name  TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_review','completed','rejected')),
  handled_by      INTEGER REFERENCES users(id),
  response_notes  TEXT,
  due_date        TIMESTAMPTZ NOT NULL,     -- NDPR: respond within 1 month
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dsr_hospital ON data_subject_requests(hospital_id);
