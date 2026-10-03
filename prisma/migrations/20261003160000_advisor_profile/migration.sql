-- AlterTable
ALTER TABLE "user" ADD COLUMN "national_id" TEXT;

-- CreateTable
CREATE TABLE "advisor_profile" (
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL DEFAULT '',
    "nif" TEXT NOT NULL DEFAULT '',
    "postal_code" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "services" JSONB NOT NULL DEFAULT '[]',
    "closed_operations" JSONB NOT NULL DEFAULT '[]',
    "deals_answered" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisor_profile_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "advisor_profile" ADD CONSTRAINT "advisor_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
