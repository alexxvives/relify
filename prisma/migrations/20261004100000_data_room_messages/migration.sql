-- AlterTable
ALTER TABLE "data_room_file" ADD COLUMN "folder" TEXT NOT NULL DEFAULT 'Otros';
ALTER TABLE "data_room_file" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum
CREATE TYPE "message_kind" AS ENUM ('question', 'meeting', 'offer');

-- CreateEnum
CREATE TYPE "message_author" AS ENUM ('seller', 'investor');

-- CreateTable
CREATE TABLE "data_room_grant" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_room_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_message" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "author" "message_author" NOT NULL,
    "kind" "message_kind" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_room_grant_investor_id_idx" ON "data_room_grant"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_room_grant_project_id_investor_id_key" ON "data_room_grant"("project_id", "investor_id");

-- CreateIndex
CREATE INDEX "project_message_project_id_investor_id_created_at_idx" ON "project_message"("project_id", "investor_id", "created_at");

-- AddForeignKey
ALTER TABLE "data_room_grant" ADD CONSTRAINT "data_room_grant_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_grant" ADD CONSTRAINT "data_room_grant_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_message" ADD CONSTRAINT "project_message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_message" ADD CONSTRAINT "project_message_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
