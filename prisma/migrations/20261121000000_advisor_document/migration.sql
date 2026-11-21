-- S37: advisor "Documentación adicional" uploads. INT already has this table (created from prisma/int-s37-advisor-documents.sql): mark it applied there (prisma migrate resolve --applied 20261121000000_advisor_document); prod runs it with prisma migrate deploy.
-- CreateTable
CREATE TABLE "advisor_document" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advisor_document_user_id_idx" ON "advisor_document"("user_id");

-- AddForeignKey
ALTER TABLE "advisor_document" ADD CONSTRAINT "advisor_document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

