-- Raw inserts without an explicit status used to land as published.
ALTER TABLE "project" ALTER COLUMN "status" SET DEFAULT 'draft';
