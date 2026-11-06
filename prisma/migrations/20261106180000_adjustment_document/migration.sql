-- EBITDA adjustment evidence. Bytes live in Postgres because Workers have no persistent disk.
CREATE TABLE IF NOT EXISTS "adjustment_document" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "adjustment_document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "adjustment_document_project_id_idx" ON "adjustment_document"("project_id");
DO $$ BEGIN
  ALTER TABLE "adjustment_document" ADD CONSTRAINT "adjustment_document_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
