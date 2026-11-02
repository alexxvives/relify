-- t84: seller photo gallery (additive)
CREATE TABLE IF NOT EXISTS "project_photo" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_photo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "project_photo_project_id_idx" ON "project_photo"("project_id");
DO $$ BEGIN
  ALTER TABLE "project_photo" ADD CONSTRAINT "project_photo_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
