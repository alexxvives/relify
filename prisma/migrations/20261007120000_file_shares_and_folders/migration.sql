-- CreateTable
CREATE TABLE "data_room_file_share" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_room_file_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_room_folder" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_room_folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_room_file_share_investor_id_idx" ON "data_room_file_share"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_room_file_share_file_id_investor_id_key" ON "data_room_file_share"("file_id", "investor_id");

-- CreateIndex
CREATE INDEX "data_room_folder_project_id_idx" ON "data_room_folder"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_room_folder_project_id_name_key" ON "data_room_folder"("project_id", "name");

-- AddForeignKey
ALTER TABLE "data_room_file_share" ADD CONSTRAINT "data_room_file_share_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "data_room_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_file_share" ADD CONSTRAINT "data_room_file_share_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_folder" ADD CONSTRAINT "data_room_folder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A room grant that already exists keeps the same files visible, one row per file.
INSERT INTO "data_room_file_share" ("id", "file_id", "investor_id", "created_at")
SELECT md5(f."id" || ':' || g."investor_id"), f."id", g."investor_id", CURRENT_TIMESTAMP
FROM "data_room_file" f
INNER JOIN "data_room_grant" g ON g."project_id" = f."project_id";
