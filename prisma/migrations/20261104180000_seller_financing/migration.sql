-- t90: seller financing (pago aplazado) deal terms on the project (additive, nullable)
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seller_financing" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seller_financing_max_pct" INTEGER;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seller_financing_years" INTEGER;
