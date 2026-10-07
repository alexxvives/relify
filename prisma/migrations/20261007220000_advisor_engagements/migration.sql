-- AlterTable
ALTER TABLE "billing_customer" ADD COLUMN "advisor_inbox" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "billing_customer" ADD COLUMN "advisor_subscription_id" TEXT;

-- Rename the listing payer. The seller pays this fee now.
ALTER TABLE "listing_payment" DROP CONSTRAINT "listing_payment_advisor_id_fkey";
ALTER TABLE "listing_payment" RENAME COLUMN "advisor_id" TO "user_id";
ALTER INDEX "listing_payment_advisor_id_idx" RENAME TO "listing_payment_user_id_idx";
ALTER TABLE "listing_payment" ADD CONSTRAINT "listing_payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "engagement_client" AS ENUM ('investor', 'seller');

-- CreateTable
CREATE TABLE "advisory_engagement" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "client" "engagement_client" NOT NULL,
    "services" TEXT[],
    "advisor_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "advisor_nda_accepted_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "charged_cents" INTEGER,
    "platform_net_cents" INTEGER,
    "platform_vat_cents" INTEGER,
    "process_opened" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisory_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_folder_open" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_folder_open_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_customer_advisor_subscription_id_key" ON "billing_customer"("advisor_subscription_id");

-- CreateIndex
CREATE INDEX "advisory_engagement_project_id_idx" ON "advisory_engagement"("project_id");

-- CreateIndex
CREATE INDEX "advisory_engagement_advisor_id_idx" ON "advisory_engagement"("advisor_id");

-- CreateIndex
CREATE INDEX "advisory_engagement_requester_id_idx" ON "advisory_engagement"("requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_folder_open_engagement_id_folder_key" ON "advisor_folder_open"("engagement_id", "folder");

-- CreateIndex
CREATE INDEX "advisor_folder_open_engagement_id_idx" ON "advisor_folder_open"("engagement_id");

-- AddForeignKey
ALTER TABLE "advisory_engagement" ADD CONSTRAINT "advisory_engagement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_engagement" ADD CONSTRAINT "advisory_engagement_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_engagement" ADD CONSTRAINT "advisory_engagement_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_folder_open" ADD CONSTRAINT "advisor_folder_open_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "advisory_engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
