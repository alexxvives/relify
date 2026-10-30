-- t62: admin-only SABI activity description
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "activity_description" TEXT;
