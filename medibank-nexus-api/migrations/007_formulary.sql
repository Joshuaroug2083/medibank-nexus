-- 007_formulary.sql
-- Drug formulary / medication catalog per hospital

CREATE TABLE IF NOT EXISTS formulary (
  id            SERIAL PRIMARY KEY,
  hospital_id   TEXT        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  generic       TEXT,
  category      TEXT        NOT NULL,
  unit          TEXT        NOT NULL DEFAULT 'tablet',
  unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock         INTEGER     NOT NULL DEFAULT 0,
  reorder_level INTEGER     NOT NULL DEFAULT 100,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS formulary_hospital_idx  ON formulary(hospital_id);
CREATE INDEX IF NOT EXISTS formulary_category_idx  ON formulary(hospital_id, category);
CREATE INDEX IF NOT EXISTS formulary_status_idx    ON formulary(hospital_id, status);
CREATE INDEX IF NOT EXISTS formulary_name_idx      ON formulary USING gin(to_tsvector('english', name));
