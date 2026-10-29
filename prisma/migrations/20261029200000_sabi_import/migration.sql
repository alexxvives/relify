-- SABI import on a company (additive only)
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "sabi_requested_at" TIMESTAMP(3);
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "sabi_imported_at" TIMESTAMP(3);
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "sabi_file_name" TEXT;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "sabi_data" JSONB;
