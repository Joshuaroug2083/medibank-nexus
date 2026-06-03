-- ============================================================
-- Migration 006 — Notifications & Job Tracking
-- ============================================================

-- Ensure notifications table has needed columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Job tracking (for BullMQ fallback when Redis unavailable)
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  job_type    TEXT        NOT NULL,   -- 'appointment_reminder','prescription_ready','lab_result'
  payload     JSONB       NOT NULL DEFAULT '{}',
  run_at      TIMESTAMPTZ NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','running','done','failed')),
  attempts    INT         NOT NULL DEFAULT 0,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_run_at  ON scheduled_jobs(run_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_tenant  ON scheduled_jobs(hospital_id);
