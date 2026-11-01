-- t73b: "informe financiero listo" notice (additive)
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "report_notified_at" TIMESTAMP(3);
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "report_notified_by_id" TEXT;
