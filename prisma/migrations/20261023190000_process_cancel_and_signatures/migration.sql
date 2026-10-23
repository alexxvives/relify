ALTER TABLE "project_access" ADD COLUMN "cancelled_at" TIMESTAMP(3);
ALTER TABLE "project_access" ADD COLUMN "cancelled_by" TEXT;
ALTER TABLE "project_access" ADD COLUMN "nda_signature" BYTEA;
ALTER TABLE "advisory_engagement" ADD COLUMN "advisor_nda_signature" BYTEA;
