-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "project" ADD COLUMN "status" "project_status" NOT NULL DEFAULT 'published';
ALTER TABLE "project" ADD COLUMN "owner_id" TEXT;

-- CreateIndex
CREATE INDEX "project_owner_id_idx" ON "project"("owner_id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
