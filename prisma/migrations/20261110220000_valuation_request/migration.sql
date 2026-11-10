-- CreateEnum
CREATE TYPE "valuation_request_status" AS ENUM ('received', 'sabi_loaded', 'drafted', 'sent', 'discarded');

-- CreateTable
CREATE TABLE "valuation_request" (
    "id" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "phone" TEXT,
    "user_id" TEXT,
    "status" "valuation_request_status" NOT NULL DEFAULT 'received',
    "project_id" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valuation_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "valuation_request_status_idx" ON "valuation_request"("status");

-- CreateIndex
CREATE INDEX "valuation_request_created_at_idx" ON "valuation_request"("created_at");

-- CreateIndex
CREATE INDEX "valuation_request_user_id_idx" ON "valuation_request"("user_id");

-- CreateIndex
CREATE INDEX "valuation_request_project_id_idx" ON "valuation_request"("project_id");

-- AddForeignKey
ALTER TABLE "valuation_request" ADD CONSTRAINT "valuation_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuation_request" ADD CONSTRAINT "valuation_request_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
