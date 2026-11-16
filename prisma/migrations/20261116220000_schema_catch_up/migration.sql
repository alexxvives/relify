-- S30: catch-up migration. INT, local dev and prod were built with `prisma db push` after 20261111120000_stripe_event,
-- so these changes from schema.prisma never had a migration. Generated with:
--   prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script
-- Existing databases already have them: mark this migration as applied (prisma migrate resolve --applied), never run it there.

-- AlterTable
ALTER TABLE "advisor_profile" ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "investor_profile" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_access" ADD COLUMN     "buyer_plan_at_match" "buyer_plan",
ADD COLUMN     "investor_read_at" TIMESTAMP(3),
ADD COLUMN     "loi_signature" BYTEA,
ADD COLUMN     "loi_signed_at" TIMESTAMP(3),
ADD COLUMN     "seller_read_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "project_view" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_hidden" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_hidden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signed_document" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "pdf" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_contract" (
    "id" TEXT NOT NULL,
    "access_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "pdf" BYTEA NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_by_role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'review',
    "review_comment" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "buyer_signature" BYTEA,
    "buyer_signed_at" TIMESTAMP(3),
    "seller_signature" BYTEA,
    "seller_signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_seen" (
    "admin_id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_seen_pkey" PRIMARY KEY ("admin_id","page")
);

-- CreateIndex
CREATE INDEX "project_view_investor_id_idx" ON "project_view"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_view_project_id_investor_id_key" ON "project_view"("project_id", "investor_id");

-- CreateIndex
CREATE INDEX "project_hidden_investor_id_idx" ON "project_hidden"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_hidden_project_id_investor_id_key" ON "project_hidden"("project_id", "investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "signed_document_key_key" ON "signed_document"("key");

-- CreateIndex
CREATE INDEX "signed_document_user_id_idx" ON "signed_document"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_contract_access_id_version_key" ON "sale_contract"("access_id", "version");

-- CreateIndex
CREATE INDEX "project_message_investor_id_kind_idx" ON "project_message"("investor_id", "kind");

-- AddForeignKey
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_view" ADD CONSTRAINT "project_view_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_hidden" ADD CONSTRAINT "project_hidden_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_hidden" ADD CONSTRAINT "project_hidden_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_contract" ADD CONSTRAINT "sale_contract_access_id_fkey" FOREIGN KEY ("access_id") REFERENCES "project_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

