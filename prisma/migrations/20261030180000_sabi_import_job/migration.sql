-- t67: background SABI import jobs
CREATE TABLE IF NOT EXISTS "sabi_import_job" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "sabi_import_job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sabi_import_job_user_id_created_at_idx" ON "sabi_import_job"("user_id", "created_at");
