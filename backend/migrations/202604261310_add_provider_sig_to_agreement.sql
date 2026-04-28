-- Migration: Add provider signature column to service_agreements
ALTER TABLE service_agreements ADD COLUMN IF NOT EXISTS provider_signature TEXT;
