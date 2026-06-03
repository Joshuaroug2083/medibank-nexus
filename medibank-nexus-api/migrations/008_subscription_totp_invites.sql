-- ────────────────────────────────────────────────────────────────
-- Migration 008: Subscription payments, TOTP 2FA, Staff invitations
-- ────────────────────────────────────────────────────────────────

/* Track Paystack subscription payments */
CREATE TABLE IF NOT EXISTS subscription_payments (
  id              SERIAL PRIMARY KEY,
  hospital_id     INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  paystack_ref    TEXT    NOT NULL UNIQUE,
  amount          BIGINT  NOT NULL DEFAULT 0,   -- in kobo
  currency        TEXT    NOT NULL DEFAULT 'NGN',
  status          TEXT    NOT NULL CHECK (status IN ('success','failed','reversed')),
  plan            TEXT    NOT NULL DEFAULT 'pro',
  paystack_payload JSONB,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_payments_hospital ON subscription_payments(hospital_id);

/* Extend hospitals table for subscription state */
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS subscription_code TEXT;

/* TOTP 2FA secrets per user */
CREATE TABLE IF NOT EXISTS totp_secrets (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret         TEXT    NOT NULL,             -- base32-encoded TOTP secret
  backup_codes   TEXT[]  NOT NULL DEFAULT '{}', -- bcrypt-hashed backup codes
  enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Staff invitation tokens */
CREATE TABLE IF NOT EXISTS staff_invitations (
  id             SERIAL PRIMARY KEY,
  hospital_id    INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  email          TEXT    NOT NULL,
  role           TEXT    NOT NULL,
  dept           TEXT,
  token_hash     TEXT    NOT NULL,
  invited_by     INTEGER REFERENCES users(id),
  expires_at     TIMESTAMPTZ NOT NULL,
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, email)
);
CREATE INDEX IF NOT EXISTS idx_invitations_hospital ON staff_invitations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email    ON staff_invitations(email);
