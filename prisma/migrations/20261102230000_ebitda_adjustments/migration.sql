-- t82: itemised EBITDA adjustments (additive)
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "ebitda_adjustments" JSONB;
