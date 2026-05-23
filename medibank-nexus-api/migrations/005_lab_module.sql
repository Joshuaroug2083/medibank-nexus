-- ============================================================
-- Migration 005 — Laboratory / Investigations Module
-- ============================================================

CREATE TABLE IF NOT EXISTS lab_orders (
  id            TEXT        PRIMARY KEY,   -- LAB-YYYY-XXXX
  hospital_id   UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id    TEXT        NOT NULL REFERENCES patients(id),
  visit_id      TEXT        REFERENCES visits(id),
  ordered_by    UUID        NOT NULL REFERENCES users(id),
  ordered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','collected','processing','completed','cancelled')),
  priority      TEXT        NOT NULL DEFAULT 'routine'
                            CHECK (priority IN ('routine','urgent','stat')),
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id            SERIAL      PRIMARY KEY,
  order_id      TEXT        NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_name     TEXT        NOT NULL,
  test_code     TEXT,
  category      TEXT,       -- 'haematology','biochemistry','microbiology','serology','urine','imaging'
  result        TEXT,
  unit          TEXT,
  reference_range TEXT,
  flag          TEXT        CHECK (flag IN ('normal','low','high','critical') OR flag IS NULL),
  result_at     TIMESTAMPTZ,
  reported_by   UUID        REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_hospital  ON lab_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient   ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_visit     ON lab_orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status    ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_order      ON lab_tests(order_id);
