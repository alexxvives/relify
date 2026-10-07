-- CreateEnum
CREATE TYPE "customer_base" AS ENUM ('business', 'consumer', 'mixed');

-- AlterTable
ALTER TABLE "project" ADD COLUMN "customer_base" "customer_base";
