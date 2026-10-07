-- AlterEnum
ALTER TYPE "project_status" ADD VALUE 'pending' BEFORE 'published';

-- AlterTable
ALTER TABLE "user" ADD COLUMN "suspended_at" TIMESTAMP(3);
