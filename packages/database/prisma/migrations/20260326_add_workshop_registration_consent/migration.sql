-- AlterTable: add consent/agreement tracking columns to workshop_registrations
ALTER TABLE "workshop_registrations"
  ADD COLUMN IF NOT EXISTS "agreement_accepted_at"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "agreement_version"      TEXT,
  ADD COLUMN IF NOT EXISTS "agreement_ip"           TEXT,
  ADD COLUMN IF NOT EXISTS "agreement_user_agent"   TEXT,
  ADD COLUMN IF NOT EXISTS "media_consent_granted"  BOOLEAN NOT NULL DEFAULT TRUE;
