-- ============================================================
-- Migration 002 — User Settings & Integrations
-- Run after 001_initial_schema.sql
-- ============================================================

-- ── User Settings ─────────────────────────────────────────
-- Server-side persistence of user preferences (supplements localStorage).
CREATE TABLE IF NOT EXISTS user_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  settings    JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_settings UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user     ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_hospital ON user_settings(hospital_id);

-- ── User Integrations ─────────────────────────────────────
-- Stores OAuth tokens (Google) and AI API keys (Anthropic, OpenAI, Google AI).
-- ALL token/key values are AES-256-GCM encrypted before insertion.
CREATE TABLE IF NOT EXISTS user_integrations (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id    UUID         NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id        UUID         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,

  -- Provider identifier: 'google' | 'anthropic' | 'openai' | 'google'
  provider       VARCHAR(50)  NOT NULL,

  -- For OAuth providers: encrypted access + refresh tokens
  -- For AI key providers: encrypted API key stored in access_token column
  access_token   TEXT,
  refresh_token  TEXT,
  token_expiry   TIMESTAMPTZ,

  -- OAuth scopes granted (array of scope strings)
  scopes         TEXT[],

  -- The email/account identifier at the provider (for display only)
  provider_email VARCHAR(255),

  connected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per user per provider
  CONSTRAINT uq_user_integration UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user     ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_hospital ON user_integrations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(user_id, provider);

-- ── Add VITE_API_URL note to .env.example ─────────────────
-- (Reminder: add to .env.example manually)
-- GOOGLE_CLIENT_ID=your-google-client-id
-- GOOGLE_CLIENT_SECRET=your-google-client-secret
-- GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/integrations/google/oauth-callback
-- OPENAI_API_KEY=sk-...
-- GOOGLE_AI_API_KEY=AIzaSy...
-- API_BASE_URL=http://localhost:3001
