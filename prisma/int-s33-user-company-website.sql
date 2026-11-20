-- INT only (RELEVA-INT Neon). Same change as prisma/migrations/20261120120000_user_company_website; apply BEFORE deploying
-- S33 to releva-int, because Prisma reads every user column. Additive and idempotent.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company_website" TEXT;
