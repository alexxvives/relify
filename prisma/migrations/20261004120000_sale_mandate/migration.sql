-- CreateTable
CREATE TABLE "sale_mandate" (
    "id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_mandate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_mandate_project_id_idx" ON "sale_mandate"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_mandate_advisor_id_project_id_key" ON "sale_mandate"("advisor_id", "project_id");

-- AddForeignKey
ALTER TABLE "sale_mandate" ADD CONSTRAINT "sale_mandate_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_mandate" ADD CONSTRAINT "sale_mandate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
