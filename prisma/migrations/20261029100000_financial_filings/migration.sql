-- Additive only: seller-uploaded Modelo 200 / cuentas anuales and extra statement lines.
ALTER TABLE "project_year" ADD COLUMN IF NOT EXISTS "financial_result_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "profit_before_tax_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "net_result_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "inventory_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "receivables_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "suppliers_cents" INTEGER,
  ADD COLUMN IF NOT EXISTS "data_source" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3);

ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "average_headcount" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "financial_filing" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "error_code" TEXT,
    "extracted" JSONB,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    CONSTRAINT "financial_filing_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_filing_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "financial_filing_project_id_year_key" ON "financial_filing"("project_id", "year");
CREATE INDEX IF NOT EXISTS "financial_filing_project_id_idx" ON "financial_filing"("project_id");
