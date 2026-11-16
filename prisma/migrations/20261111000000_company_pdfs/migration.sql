-- AlterTable
ALTER TABLE "project" ADD COLUMN "teaser_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "project_teaser_token_key" ON "project"("teaser_token");

-- CreateTable
CREATE TABLE "pdf_download" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_download_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pdf_download_project_id_created_at_idx" ON "pdf_download"("project_id", "created_at");

-- AddForeignKey
ALTER TABLE "pdf_download" ADD CONSTRAINT "pdf_download_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_download" ADD CONSTRAINT "pdf_download_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
