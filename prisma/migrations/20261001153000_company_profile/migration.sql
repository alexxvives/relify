-- CreateEnum
CREATE TYPE "headcount_range" AS ENUM ('band_1_5', 'band_6_10', 'band_11_20', 'band_21_50', 'band_over_50');

-- CreateEnum
CREATE TYPE "cnae_role" AS ENUM ('principal', 'secondary');

-- CreateEnum
CREATE TYPE "activity_slice_kind" AS ENUM ('capital', 'product', 'client');

-- CreateEnum
CREATE TYPE "financial_year_kind" AS ENUM ('closed', 'forecast');

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "description" TEXT,
ADD COLUMN     "founded_year" INTEGER,
ADD COLUMN     "headcount_range" "headcount_range",
ADD COLUMN     "opex_cents" INTEGER;

-- CreateTable
CREATE TABLE "project_cnae" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "cnae_role" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "project_cnae_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_slice" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "kind" "activity_slice_kind" NOT NULL,
    "position" INTEGER NOT NULL,
    "basis_points" INTEGER NOT NULL,

    CONSTRAINT "activity_slice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_year" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "kind" "financial_year_kind" NOT NULL,
    "sales_cents" INTEGER,
    "inventory_change_cents" INTEGER,
    "own_use_cents" INTEGER,
    "supplies_cents" INTEGER,
    "other_operating_income_cents" INTEGER,
    "staff_costs_cents" INTEGER,
    "other_operating_costs_cents" INTEGER,
    "grant_income_cents" INTEGER,
    "provision_surplus_cents" INTEGER,
    "asset_impairment_cents" INTEGER,
    "subsidiary_control_loss_cents" INTEGER,
    "negative_difference_cents" INTEGER,
    "other_results_cents" INTEGER,
    "amortization_cents" INTEGER,
    "current_assets_cents" INTEGER,
    "cash_cents" INTEGER,
    "non_current_assets_cents" INTEGER,
    "current_liabilities_cents" INTEGER,
    "long_term_debt_cents" INTEGER,
    "non_current_liabilities_cents" INTEGER,
    "short_term_debt_cents" INTEGER,
    "equity_cents" INTEGER,

    CONSTRAINT "project_year_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_cnae_project_id_idx" ON "project_cnae"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_cnae_project_id_code_key" ON "project_cnae"("project_id", "code");

-- CreateIndex
CREATE INDEX "activity_slice_project_id_idx" ON "activity_slice"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_slice_project_id_kind_position_key" ON "activity_slice"("project_id", "kind", "position");

-- CreateIndex
CREATE INDEX "project_year_project_id_idx" ON "project_year"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_year_project_id_year_key" ON "project_year"("project_id", "year");

-- AddForeignKey
ALTER TABLE "project_cnae" ADD CONSTRAINT "project_cnae_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_slice" ADD CONSTRAINT "activity_slice_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_year" ADD CONSTRAINT "project_year_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
