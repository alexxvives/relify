-- AlterTable
ALTER TABLE "user" ADD COLUMN "referral_source" TEXT;
ALTER TABLE "user" ADD COLUMN "onboarded_at" TIMESTAMP(3);

-- Existing accounts already chose a role at sign-up.
UPDATE "user" SET "onboarded_at" = "created_at" WHERE "role" IS NOT NULL;
