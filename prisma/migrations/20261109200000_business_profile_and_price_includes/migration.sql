-- t96: optional Cómo es tu negocio fields and asking-price basis (additive, nullable).
-- Apply only to INT Neon project silent-rain-47735324; never production.
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "owner_dependence" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "premises_kind" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "rent_monthly_cents" BIGINT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "lease_years_remaining" INTEGER;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "recurring_revenue_pct" INTEGER;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seasonality" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seasonality_note" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "top5_clients_pct" INTEGER;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "asking_price_includes" TEXT;
