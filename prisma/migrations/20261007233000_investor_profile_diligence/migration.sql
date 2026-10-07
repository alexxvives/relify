-- AlterTable
ALTER TABLE "project_access" ADD COLUMN "diligence_passed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "investor_profile" (
    "user_id" TEXT NOT NULL,
    "photo_path" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "investor_type" TEXT NOT NULL DEFAULT '',
    "ticket" TEXT NOT NULL DEFAULT '',
    "sectors" TEXT NOT NULL DEFAULT '',
    "thesis" TEXT NOT NULL DEFAULT '',
    "contribution" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_profile_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "investor_profile" ADD CONSTRAINT "investor_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
