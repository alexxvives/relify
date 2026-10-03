-- CreateTable
CREATE TABLE "project_access" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nda_accepted_at" TIMESTAMP(3),

    CONSTRAINT "project_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_access_investor_id_idx" ON "project_access"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_access_project_id_investor_id_key" ON "project_access"("project_id", "investor_id");

-- AddForeignKey
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
