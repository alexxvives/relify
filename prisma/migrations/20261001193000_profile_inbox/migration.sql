-- AlterTable
ALTER TABLE "user" ADD COLUMN "last_name" TEXT;
ALTER TABLE "user" ADD COLUMN "phone" TEXT;
ALTER TABLE "user" ADD COLUMN "pending_cif" TEXT;

-- CreateTable
CREATE TABLE "project_favorite" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisory_quote" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "services" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisory_quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_favorite_investor_id_idx" ON "project_favorite"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_favorite_project_id_investor_id_key" ON "project_favorite"("project_id", "investor_id");

-- CreateIndex
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "advisory_quote_investor_id_idx" ON "advisory_quote"("investor_id");

-- AddForeignKey
ALTER TABLE "project_favorite" ADD CONSTRAINT "project_favorite_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_favorite" ADD CONSTRAINT "project_favorite_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_quote" ADD CONSTRAINT "advisory_quote_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
