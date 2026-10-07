-- CreateEnum
CREATE TYPE "buyer_plan" AS ENUM ('none', 'limited', 'unlimited');

-- AlterTable
ALTER TABLE "project_access" ADD COLUMN "seller_accepted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "billing_customer" (
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "plan" "buyer_plan" NOT NULL DEFAULT 'none',
    "stripe_subscription_id" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),

    CONSTRAINT "billing_customer_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "listing_payment" (
    "id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "stripe_checkout_session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_fee" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "closed_price_cents" INTEGER NOT NULL,
    "buyer_net_cents" INTEGER NOT NULL,
    "buyer_vat_cents" INTEGER NOT NULL,
    "seller_net_cents" INTEGER NOT NULL,
    "seller_vat_cents" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "success_fee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_customer_stripe_customer_id_key" ON "billing_customer"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_customer_stripe_subscription_id_key" ON "billing_customer"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_payment_project_id_key" ON "listing_payment"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_payment_stripe_checkout_session_id_key" ON "listing_payment"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "listing_payment_advisor_id_idx" ON "listing_payment"("advisor_id");

-- CreateIndex
CREATE UNIQUE INDEX "success_fee_project_id_key" ON "success_fee"("project_id");

-- AddForeignKey
ALTER TABLE "billing_customer" ADD CONSTRAINT "billing_customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_payment" ADD CONSTRAINT "listing_payment_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_payment" ADD CONSTRAINT "listing_payment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_fee" ADD CONSTRAINT "success_fee_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
