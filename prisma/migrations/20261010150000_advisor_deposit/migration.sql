ALTER TABLE "advisory_engagement" ADD COLUMN "deposit_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "advisory_engagement" ADD COLUMN "deposit_paid_at" TIMESTAMP(3);
ALTER TABLE "advisory_engagement" ADD COLUMN "deposit_session_id" TEXT;

CREATE UNIQUE INDEX "advisory_engagement_deposit_session_id_key" ON "advisory_engagement"("deposit_session_id");
