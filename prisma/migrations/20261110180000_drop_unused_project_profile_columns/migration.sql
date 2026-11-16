-- Round M: drop seller-profile columns the product no longer reads or writes.
-- Prisma no longer maps these fields, so leftover columns on production are ignored
-- until this migration is applied there. Apply to INT first; Alex applies to prod.
ALTER TABLE "project" DROP COLUMN IF EXISTS "seasonality";
ALTER TABLE "project" DROP COLUMN IF EXISTS "seasonality_note";
ALTER TABLE "project" DROP COLUMN IF EXISTS "top5_clients_pct";
