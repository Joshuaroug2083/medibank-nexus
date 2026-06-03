-- ============================================================
-- Migration 003 — Billing & Payments
-- ============================================================

/* ── invoices ─────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS invoices (
  id                  TEXT        PRIMARY KEY,
  hospital_id         UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id          TEXT        NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  visit_id            TEXT        REFERENCES visits(id),
  status              TEXT        NOT NULL DEFAULT 'unpaid'   -- unpaid | partial | paid | cancelled | waived
                        CHECK (status IN ('unpaid','partial','paid','cancelled','waived')),
  total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid                NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance             NUMERIC(12,2) NOT NULL DEFAULT 0,
  insurance_provider  TEXT,
  ins_number          TEXT,
  notes               TEXT,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at             TIMESTAMPTZ,
  created_by          UUID        REFERENCES users(id),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_hospital   ON invoices(hospital_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient    ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at  ON invoices(issued_at);

/* ── invoice_items ────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS invoice_items (
  id          SERIAL      PRIMARY KEY,
  invoice_id  TEXT        NOT NULL REFERENCES invoices(id)  ON DELETE CASCADE,
  hospital_id UUID        NOT NULL,
  description TEXT        NOT NULL,
  quantity    NUMERIC     NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    TEXT        DEFAULT 'service'  -- service | drug | lab | procedure | consultation
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

/* ── payments ─────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL      PRIMARY KEY,
  invoice_id  TEXT        NOT NULL REFERENCES invoices(id)  ON DELETE CASCADE,
  hospital_id UUID        NOT NULL,
  patient_id  TEXT        NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  method      TEXT        DEFAULT 'cash'  -- cash | card | transfer | nhis | insurance | pos
                CHECK (method IN ('cash','card','transfer','nhis','insurance','pos','other')),
  reference   TEXT,        -- bank ref, POS receipt, etc.
  notes       TEXT,
  received_by UUID        REFERENCES users(id),
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice  ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient  ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at  ON payments(paid_at);
