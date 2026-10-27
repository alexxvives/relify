-- CreateTable
CREATE TABLE "company_registry_cache" (
    "cif" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "record" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_registry_cache_pkey" PRIMARY KEY ("cif","source")
);
