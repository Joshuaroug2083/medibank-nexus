-- ============================================================
-- Migration 004 — Password Resets
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  user_id     UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID        NOT NULL,
  token_hash  TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
