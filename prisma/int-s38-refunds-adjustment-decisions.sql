-- S38 INT pack: same SQL as prisma/migrations/20261121010000_s38_refunds_adjustment_decisions. Apply on INT, then mark that migration applied.
-- AlterTable
ALTER TABLE "project_message" ADD COLUMN     "advisor_id" TEXT;

-- CreateTable
CREATE TABLE "ebitda_adjustment_decision" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "admin_id" TEXT,
    "admin_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ebitda_adjustment_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_refund" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "project_id" TEXT,
    "session_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripe_refund_id" TEXT,
    "error" TEXT,
    "requested_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ebitda_adjustment_decision_project_id_row_id_idx" ON "ebitda_adjustment_decision"("project_id", "row_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_refund_engagement_id_key" ON "deposit_refund"("engagement_id");

-- AddForeignKey
ALTER TABLE "ebitda_adjustment_decision" ADD CONSTRAINT "ebitda_adjustment_decision_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

