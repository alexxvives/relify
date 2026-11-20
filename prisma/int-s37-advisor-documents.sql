-- Round S37: advisor "Documentación adicional" uploads (Mis servicios). Idempotent.
CREATE TABLE IF NOT EXISTS "advisor_document" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "advisor_document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "advisor_document_user_id_idx" ON "advisor_document"("user_id");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advisor_document_user_id_fkey') THEN
    ALTER TABLE "advisor_document" ADD CONSTRAINT "advisor_document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
