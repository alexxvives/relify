-- CreateTable
CREATE TABLE "company_registry_prefill" (
    "user_id" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "founded_year" INTEGER,
    "description" TEXT,
    "principal_cnae" TEXT,
    "secondary_cnaes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revenue_cents" INTEGER,
    "ebitda_cents" INTEGER,
    "adjusted_ebitda_cents" INTEGER,
    "headcount_range" "headcount_range",
    "statement_year" INTEGER,

    CONSTRAINT "company_registry_prefill_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "company_registry_prefill" ADD CONSTRAINT "company_registry_prefill_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
