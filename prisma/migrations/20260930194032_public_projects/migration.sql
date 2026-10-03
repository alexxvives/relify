-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "revenue_cents" INTEGER NOT NULL,
    "ebitda_cents" INTEGER NOT NULL,
    "adjusted_ebitda_cents" INTEGER NOT NULL,
    "asking_price_cents" INTEGER NOT NULL,
    "net_debt_cents" INTEGER NOT NULL,
    "working_capital_cents" INTEGER NOT NULL,
    "net_income_cents" INTEGER NOT NULL,
    "legal_name" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareholder" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_room_file" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,

    CONSTRAINT "data_room_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_slug_key" ON "project"("slug");

-- CreateIndex
CREATE INDEX "shareholder_project_id_idx" ON "shareholder"("project_id");

-- CreateIndex
CREATE INDEX "data_room_file_project_id_idx" ON "data_room_file"("project_id");

-- AddForeignKey
ALTER TABLE "shareholder" ADD CONSTRAINT "shareholder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_file" ADD CONSTRAINT "data_room_file_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
